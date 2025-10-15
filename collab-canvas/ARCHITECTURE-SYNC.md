# Hybrid Sync Architecture - Design Document

## Overview
Two-tier synchronization architecture combining Firebase Realtime Database (RTDB) for ultra-low latency active updates with Firestore for persistent data storage.

## Problem Statement
**Current Architecture:**
- All shape updates go through Firestore
- 300ms debouncing to reduce write costs
- Total latency: ~350ms (50ms Firestore + 300ms debounce)
- Noticeable lag during collaborative editing

**Goal:**
- Reduce latency from 350ms → 20-30ms (90% improvement)
- Support 10+ concurrent users smoothly
- Maintain data persistence and reliability

## Architecture Design

### Two-Tier Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                           │
│                    (Drag, Edit, Create)                      │
└──────────────────┬────────────────────────────────────────┬──┘
                   │                                        │
                   ▼                                        ▼
    ┌──────────────────────────┐              ┌──────────────────────────┐
    │   Tier 1: Realtime DB    │              │   Tier 2: Firestore      │
    │   (Active Updates)       │              │   (Persistence)          │
    ├──────────────────────────┤              ├──────────────────────────┤
    │ • Drag move positions    │              │ • Final positions        │
    │ • Text during editing    │              │ • Shape creation         │
    │ • Ephemeral changes      │              │ • Shape deletion         │
    │                          │              │ • Permanent properties   │
    │ Latency: 10-20ms         │              │ Latency: 50-100ms        │
    │ No debouncing            │              │ 100ms debounce           │
    └──────────────┬───────────┘              └───────────┬──────────────┘
                   │                                      │
                   ▼                                      ▼
    ┌──────────────────────────────────────────────────────────┐
    │                All Connected Clients                      │
    │     (Merge RTDB active + Firestore persistent)           │
    └──────────────────────────────────────────────────────────┘
```

### Data Structures

#### Realtime Database (Ephemeral)
```typescript
/active-shapes/
  main-canvas/
    {shapeId}/
      x: number              // Current X position
      y: number              // Current Y position
      text: string           // Current text (if type=text)
      userId: string         // User currently editing
      userName: string       // Display name
      userColor: string      // User color for indicator
      timestamp: number      // Last update time
      type: 'drag' | 'edit'  // Type of active edit
```

**Characteristics:**
- Auto-cleanup on disconnect
- TTL: 5 seconds of inactivity
- No history, only current state
- Optimized for high-frequency updates

#### Firestore (Persistent)
```typescript
canvases/
  main-canvas/
    objects/
      {shapeId}/
        id: string
        type: 'rectangle' | 'circle' | 'triangle' | 'text'
        x: number
        y: number
        width?: number
        height?: number
        radius?: number
        text?: string
        fontSize?: number
        fill: string
        rotation?: number
        createdBy: string
        lastModifiedBy: string
        lastModifiedAt: number
```

**Characteristics:**
- Permanent storage
- 100ms debounced writes
- Full audit trail (timestamps)
- Backup and recovery

## Update Flows

### Shape Dragging Flow

```
1. User clicks shape
   → Select shape locally (instant)

2. User starts dragging (onDragStart)
   → markShapeActive(shapeId) in RTDB
   → Set isDragging=true locally

3. User moves mouse (onDragMove) - 60 FPS
   → Update local position (instant)
   → updateActivePosition(shapeId, x, y) to RTDB (no throttle)
   → Skip Firestore update

4. User releases mouse (onDragEnd)
   → Update final position to Firestore (debounced 100ms)
   → markShapeInactive(shapeId) in RTDB
   → Set isDragging=false locally
   → RTDB entry auto-deletes after 1 second

5. Other users receive updates
   → Subscribe to RTDB active-shapes
   → Merge with Firestore data
   → Render updated position (10-20ms total latency)
```

### Text Editing Flow

```
1. User double-clicks text
   → Enter edit mode
   → markShapeActive(shapeId, type='edit') in RTDB

2. User types (onChange)
   → Update local text (instant)
   → updateActiveText(shapeId, text) to RTDB (no throttle)
   → Skip Firestore update

3. User presses Enter or clicks away (onBlur)
   → Save final text to Firestore (debounced 100ms)
   → markShapeInactive(shapeId) in RTDB
   → Exit edit mode

4. Other users see updates
   → Realtime text changes via RTDB
   → Final version saved to Firestore
```

### Shape Creation Flow
```
1. User creates shape (R/C/T/A + click)
   → Generate unique ID
   → Create in Firestore immediately (no RTDB)
   → Optimistic local update

2. Firestore broadcasts to all users
   → All users receive new shape
   → Add to local state
   → Render on canvas
```

### Shape Deletion Flow
```
1. User selects and deletes shape
   → Delete from Firestore immediately
   → Remove from RTDB if active
   → Remove from local state

2. Firestore broadcasts deletion
   → All users remove shape
```

## Merge Strategy

### Data Priority
When a shape exists in both RTDB and Firestore:

```typescript
function mergeShape(firestoreShape, rtdbActive) {
  if (!rtdbActive) {
    // No active edit, use Firestore
    return firestoreShape;
  }
  
  if (rtdbActive.timestamp > firestoreShape.lastModifiedAt) {
    // Active edit is newer, merge with RTDB data
    return {
      ...firestoreShape,
      x: rtdbActive.x,
      y: rtdbActive.y,
      text: rtdbActive.text || firestoreShape.text,
      // Keep other properties from Firestore
    };
  }
  
  // Firestore is newer (shouldn't happen but handle it)
  return firestoreShape;
}
```

## Conflict Resolution

### Simultaneous Edits
When two users edit the same shape:

**Strategy: Last Touch Wins**
```typescript
// User A starts dragging at t=100
// User B starts dragging at t=150
// → User B wins (latest timestamp)

if (rtdbShape.userId !== currentUserId) {
  // Different user is editing
  if (rtdbShape.timestamp > localTimestamp) {
    // Remote edit is newer, accept it
    applyRemoteUpdate(rtdbShape);
  }
}
```

**Visual Feedback:**
- Show pulsing border in user's color
- Display name label: "Being edited by [UserName]"
- Prevent local editing while remotely active

## Cleanup & Garbage Collection

### Automatic Cleanup
```typescript
// Run every 10 seconds
setInterval(() => {
  const now = Date.now();
  const STALE_THRESHOLD = 5000; // 5 seconds
  
  activeShapes.forEach((shape, shapeId) => {
    if (now - shape.timestamp > STALE_THRESHOLD) {
      // Shape hasn't been updated in 5 seconds
      removeActiveShape(shapeId);
    }
  });
}, 10000);
```

### Disconnect Cleanup
```typescript
// On user disconnect
onDisconnect(rtdb.ref(`active-shapes/main-canvas/${shapeId}`))
  .remove();

// Cleans up all active shapes for disconnected user
```

## Performance Characteristics

### Latency Comparison

| Operation | Before (Firestore Only) | After (Hybrid) | Improvement |
|-----------|------------------------|----------------|-------------|
| Drag Move | 350ms | 20ms | 94% faster |
| Text Edit | 350ms | 20ms | 94% faster |
| Create Shape | 100ms | 100ms | Same |
| Delete Shape | 50ms | 50ms | Same |
| Cursor Move | 35ms | 35ms | Same |

### Write Operations

**Before (Firestore Only):**
- Drag 100px: ~100 writes (one per mouse move event, debounced)
- Writes/minute: ~200 (with 300ms debounce)

**After (Hybrid):**
- Drag 100px: 1 Firestore write + unlimited RTDB writes
- Firestore writes/minute: ~60 (with 100ms debounce, only on drag end)
- RTDB writes/minute: ~3600 (60 FPS) - included in free tier

### Scalability

**Concurrent Users:**
- Before: 5 users recommended
- After: 10+ users supported

**Active Shapes:**
- RTDB can handle 100+ simultaneous active shapes
- No performance degradation

## Fallback Strategy

### RTDB Unavailable
```typescript
if (!rtdb || rtdbConnectionFailed) {
  console.warn('RTDB unavailable, falling back to Firestore-only');
  
  // Use Firestore with reduced debounce
  useFallbackMode({
    debounce: 100ms,
    showWarning: 'Real-time sync limited'
  });
}
```

### Firestore Unavailable
```typescript
if (!firestore || firestoreConnectionFailed) {
  console.error('Firestore unavailable, data may not persist');
  
  // Use RTDB only (ephemeral)
  useEphemeralMode({
    warning: 'Changes will not be saved'
  });
}
```

## Security Rules

### Realtime Database Rules
```json
{
  "rules": {
    "active-shapes": {
      "$canvasId": {
        "$shapeId": {
          ".read": "auth != null",
          ".write": "auth != null",
          ".validate": "newData.hasChildren(['x', 'y', 'userId', 'timestamp'])"
        }
      }
    }
  }
}
```

### Firestore Rules (Unchanged)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /canvases/{canvasId}/objects/{objectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

## Implementation Checklist

- [x] Architecture design document
- [ ] Reduce Firestore debounce: 300ms → 100ms
- [ ] Create useRealtimeSync hook
- [ ] Integrate RTDB updates in drag handlers
- [ ] Integrate RTDB updates in text editing
- [ ] Add active shape visual indicators
- [ ] Implement conflict resolution
- [ ] Add automatic cleanup
- [ ] Add fallback mechanisms
- [ ] Update database security rules
- [ ] Performance testing and benchmarking
- [ ] Documentation and deployment

## Expected Outcomes

**User Experience:**
- ✅ Shapes feel instant when dragging (20ms vs 350ms)
- ✅ Text updates appear in real-time
- ✅ Smooth collaboration with 10+ users
- ✅ No data loss (Firestore backup)
- ✅ Visual indicators show who's editing what

**Technical Benefits:**
- ✅ 90% latency reduction
- ✅ 60% fewer Firestore writes
- ✅ Better Firebase quota utilization
- ✅ Graceful degradation if services fail
- ✅ Scalable to 20+ concurrent users

---

*Document Version: 1.0*  
*Last Updated: October 15, 2025*  
*PR: #12 - Hybrid Sync Architecture*

