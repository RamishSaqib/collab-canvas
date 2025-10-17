# CollabCanvas - Product Requirements Document

## Project Overview
Real-time collaborative canvas application (Figma-like) with multiplayer synchronization. Prioritize the primary designer experience first, then add collaborative features.

## Tech Stack
**Frontend:** React 19 + TypeScript + react-konva  
**Backend:** Firebase (Firestore, Realtime Database, Auth, Hosting)  
**AI:** OpenAI GPT-4 Turbo

## Core Requirements
- Pan and zoom (60 FPS performance)
- Shape support (rectangles, circles, triangles, text)
- Real-time sync (<100ms for objects, <50ms for cursors)
- User authentication (email/password + Google OAuth)
- Presence awareness
- Multi-user collaboration (5+ concurrent users)

## Performance Targets
- 60 FPS during all interactions
- <100ms object sync latency
- <50ms cursor sync
- 500+ shapes on canvas without FPS drops

---

## Completed PRs

### PR #1: Project Setup & Deployment Pipeline 🔧
*Oct 14, 2025*
- Vite + React 19 + TypeScript
- Firebase configuration (Auth, Firestore, RTDB)
- Security rules and testing infrastructure

### PR #2: Authentication System 🔐
*Oct 14, 2025*
- Email/password + Google OAuth
- AuthWrapper with session persistence
- User profiles with consistent colors

### PR #3: Basic Canvas with Pan & Zoom 🎨
*Oct 14, 2025*
- Full-screen react-konva canvas
- Pan (click-drag) and zoom (mouse wheel, 10%-500%)
- Real-time canvas info overlay

### PR #4: Shape Creation & Manipulation 📦
*Oct 14, 2025*
- Rectangle creation tool
- Shape selection and drag-to-move
- Keyboard shortcuts (V, R, ESC)

### PR #5: State Persistence (Firestore) 💾
*Oct 14, 2025*
- useFirestore hook with real-time subscriptions
- Auto-persistence for create/update/delete

### PR #6: Real-Time Object Sync 🔄
*Oct 14, 2025*
- Multi-window/cross-user synchronization
- Last-write-wins conflict resolution
- <100ms sync latency

### PR #7: Multiplayer Cursors 👆
*Oct 14, 2025*
- Cursor tracking and broadcasting (throttled 30 Hz)
- RTDB integration with auto-cleanup
- <35ms cursor sync

### PR #8: Presence Awareness 👥
*Oct 14, 2025*
- Collapsible sidebar with online users
- Heartbeat system (30s intervals)
- Color-coded avatars

### PR #9: Performance Optimization ⚡
*Oct 14, 2025*
- React.memo and useCallback optimizations
- Debounced Firestore updates (300ms)
- 60 FPS with 500+ shapes

### PR #10: Final Polish & Documentation ✨
*Oct 14, 2025*
- Shape deletion, keyboard shortcuts modal
- Error boundaries, loading states
- Production deployment

### PR #11: Additional Shape Types ✨
*Oct 15, 2025*
- Circle, Triangle, and Text tools
- Keyboard shortcuts (C, T, A)
- Real-time sync for all shape types

### PR #12: Hybrid Sync Architecture ⚡
*Oct 15, 2025*
- Two-tier sync: RTDB (ephemeral) + Firestore (persistent)
- Active shape tracking during drag/edit
- Reduced latency from ~350ms to ~20-30ms (90% improvement)

### PR #13: Color Customization System 🎨
*Oct 15, 2025*
- ColorWheel and ColorPicker components
- Pre/post-creation color selection
- Keyboard shortcuts (P to toggle)

### PR #14: Conflict Resolution & Persistence 🏆
*Oct 15, 2025*
- Active shape visual indicators
- Operation queue with retry logic
- Connection status banner with offline support
- **Achievement:** Conflict Resolution 9/9, Persistence 9/9 (EXCELLENT)

### PR #15: Transform Operations & Multi-Select ⚡
*Oct 16, 2025*
- Multi-select (Shift+Click, drag-to-select)
- Konva Transformer (resize, rotate)
- Layer management (Ctrl+] / Ctrl+[)
- Text formatting toolbar
- **Achievement:** Canvas Functionality 8/8 (EXCELLENT)

### PR #16: Figma-Inspired Features 🏆
*Oct 16, 2025*
- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z, 50-item history)
- Alignment tools (6 operations + 2 distributions)
- Collaborative comments with real-time sync
- **Achievement:** Advanced Features 15/15 (EXCELLENT)

### PR #17: Canvas UX & Interaction Polish ✨
*Oct 16, 2025*
- Hand tool for panning (H key)
- White canvas background
- Smooth cursor username display
- Offline user cursor cleanup

### PR #18: Canvas Coordinates & Text Polish 🎯
*Oct 16, 2025*
- Coordinate display (grid origin at center)
- Reduced text selection stroke (50% thinner)

---

## Current & Upcoming PRs

### PR #19: AI Canvas Agent - Creation & Complex Commands ✅
*Oct 17, 2025 - COMPLETE*

**Achievements:**
- OpenAI GPT-4 Turbo integration
- Command parser with structured JSON
- Creation commands (shapes with colors & positions)
- Grid layouts (NxN grids)
- Complex commands (login forms, navbars, card layouts, buttons)
- Explicit positioning (grid coordinate system)
- Sub-2 second response times

**Score:** 18-21/25 (Good to Excellent)
- Command Breadth: 5-6/10 (6 command types)
- Complex Execution: 7-8/8 ✅
- Performance: 6-7/7 ✅

---

### PR #20: AI Canvas Agent - Manipulation Commands 🎯
**Goal:** Reach EXCELLENT rating (22-25/25)

**Target:** Add 3-4 manipulation command types → 9-10 total distinct types

**Commands to Implement:**
1. **Move** - "Move the blue rectangle to the center"
2. **Resize** - "Resize the circle to be twice as big"
3. **Rotate** - "Rotate the text 45 degrees"
4. **Change Color** - "Change all red shapes to green"
5. **Delete** - "Delete all circles"

**Implementation:**
- Shape querying system (by type, color, selection)
- executeMove, executeResize, executeRotate, executeChangeColor, executeDelete
- Update AI prompt with manipulation examples
- Integrate with undo/redo system

**Success Criteria:**
- Command Breadth: 9-10/10 (EXCELLENT)
- Total Score: 22-25/25 (EXCELLENT) 🏆
- 90%+ accuracy for all manipulations
- Sub-2 second response times

---

## Success Criteria
**MVP Passes If:**
✅ Real-time cursors and shapes sync  
✅ Canvas state persists  
✅ Deployed and publicly accessible  
✅ Authentication works  
✅ 60 FPS performance  
✅ No critical bugs
