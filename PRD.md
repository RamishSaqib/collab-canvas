CollabCanvas MVP - Product Requirements Document
Project Overview
Build a real-time collaborative canvas application (Figma-like) with multiplayer synchronization as the foundation. The MVP focuses exclusively on proving the collaborative infrastructure works flawlessly.
Development Philosophy: Prioritize the primary user/designer/creator experience first. Once core user stories for the designer are complete, add collaborator features.
Timeline: 24 hours for MVP checkpoint (Tuesday)
Hard Gate: Must pass all MVP requirements to continue

MVP Requirements (Hard Gate)
Core Features - Must Have

Canvas Workspace

Pan and zoom functionality
Large workspace (doesn't need to be infinite, but spacious)
60 FPS performance during all interactions


Shape Support

At least ONE shape type implemented (rectangle, circle, OR text)
Ability to create shapes on canvas
Ability to move/drag shapes


Real-Time Collaboration

Sync between 2+ users in real-time
Multiplayer cursors with name labels
Presence awareness (who's currently online)
Object changes appear instantly for all users (<100ms sync)
Cursor positions sync in <50ms


User System

User authentication (accounts/names)
Users can be identified in the session


Deployment

Publicly accessible deployed application
Must support 5+ concurrent users without degradation




Technical Architecture
Tech Stack (Confirmed)
Frontend:

React with TypeScript
react-konva for canvas rendering

Built-in support for shapes, transformations, events
Performance optimized for 60 FPS
Good React integration



Backend & Services:

Firebase Firestore - Canvas state persistence
Firebase Realtime Database - Cursor positions (faster for frequent updates)
Firebase Auth - User authentication
Firebase Hosting - Deployment

Core Components:

Canvas - Main workspace component (dynamic/responsive)
Shape - Rectangle renderer with highlight on selection
Cursor - Multiplayer cursor component
Toolbar - Top bar for shape creation
PresenceList - Online users sidebar
AuthWrapper - Authentication flow (email/password + Google OAuth)

Data Flow:

User action (create/move shape) → Local state update
Broadcast change to backend
Backend broadcasts to all connected clients
Clients receive update → Render change

Data Models
typescript// User
interface User {
  id: string;
  name: string;
  email: string;
  color: string; // for cursor
}

// Cursor Position
interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

// Canvas Object (Shape)
interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill: string;
  rotation?: number;
  createdBy: string;
  lastModifiedBy: string;
  lastModifiedAt: number;
}

// Canvas State
interface CanvasState {
  objects: Record<string, CanvasObject>;
  version: number; // for conflict resolution
}

// Presence
interface Presence {
  userId: string;
  userName: string;
  color: string;
  lastSeen: number;
}

Implementation Phases
Priority Order: Designer First, Then Collaborator
User Story Focus:

Primary Designer - Individual can create and manipulate shapes
Collaborator - Multiple users can see and interact with shared canvas

Phase 1: Foundation & Deployment
Goal: Get something deployed

Project Setup

Initialize React + TypeScript project (Vite recommended for speed)
Set up Firebase project (Firestore, Auth, Hosting)
Configure environment variables
Deploy "Hello World" to verify deployment pipeline


Authentication

Firebase Auth integration
Both email/password AND Google OAuth options
Display logged-in user name
Simple login/signup UI


Basic Canvas

Set up react-konva Stage and Layer
Dynamic/responsive canvas that adapts to viewport
Implement pan (drag canvas)
Implement zoom (mouse wheel)
Test 60 FPS performance



Phase 2: Single Designer Experience
Goal: Core creation and manipulation works perfectly for one user

Shape Creation

Rectangle shape (x, y, width, height, fill color)
Top bar toolbar for shape creation
Click toolbar button → Click canvas → Create shape
Render shape on canvas
Store shapes in local React state


Shape Manipulation

Click to select shape
Drag to move shape
Highlight selected shape (border or color change)
Test: Create, select, move multiple shapes smoothly


State Persistence

Save to Firestore immediately on every change (create, move)
On page load → Fetch existing canvas state
Test: Refresh page, shapes persist



Phase 3: Multiplayer Collaboration
Goal: Multiple designers can collaborate in real-time

Cursor Sync

Track local mouse position
Broadcast cursor position to Realtime Database
Subscribe to other users' cursors
Render other users' cursors with name labels
Test: Open two browser windows, see both cursors


Presence System

Track online users in Realtime Database
Display online users list
Handle user disconnect (remove from presence)


Object Sync

When shape created → Save to Firestore immediately → Broadcast
When shape moved → Update Firestore immediately → Broadcast
Listen to Firestore changes → Update local state
Test: Create shape in window 1, appears in window 2


Conflict Resolution

Implement "last write wins" approach
Add timestamp to each update
Document the approach in README



Phase 4: Polish & Testing

Performance Testing

Test with 3-4 browser windows simultaneously
Test rapid shape creation/movement
Ensure 60 FPS maintained
Test reconnection after network disconnect


Final Deployment & Documentation

Final deployment to Firebase Hosting
README with setup instructions
Architecture overview
Public demo link




Critical Decisions & Challenges
Decision 1: Shape Type - Rectangle
Using Rectangle as the single MVP shape

Simplest to implement (x, y, width, height)
Easy to click/select (rectangular bounds)
Sufficient to prove multiplayer sync works

Decision 2: Firebase (Confirmed)
Using Firebase for all backend services

Faster to implement
Built-in authentication
Handles scaling and connection management
Free tier sufficient for MVP

Decision 3: Cursor Sync Strategy
Challenge: Cursors move 60 times/second. Syncing every position = network overload.
Solution: Throttle cursor broadcasts to 20-30 updates/second

Use lodash throttle or similar
Acceptable UX, massive bandwidth savings

Decision 4: Object Sync Architecture
Immediate sync strategy (save on every change)
Approach:

Every shape creation/movement triggers immediate Firestore write
Use Firestore for object state (persistent)
Use Realtime Database for cursors (ephemeral, high frequency)
Only sync object deltas (changed properties), not entire state

Trade-offs:

✅ True real-time collaboration
✅ No data loss risk
⚠️ Higher Firestore write count (monitor free tier usage)
⚠️ May need optimization if performance issues arise

Decision 5: Conflict Resolution
Challenge: Two users edit the same object simultaneously.
Options:

Last Write Wins (simplest) - Use timestamp, latest change wins
Operational Transform - Complex, not feasible in 24h
Lock Objects - User locks object when editing, blocks others

Recommendation: Last Write Wins - Document it clearly, acceptable for MVP

Performance Targets
Must Hit These Numbers:

60 FPS during pan, zoom, object manipulation
<100ms object sync latency between users
<50ms cursor position sync
500+ objects on canvas without FPS drops
5+ concurrent users without degradation

Performance Strategies:

Use Konva.js caching for complex shapes
Throttle cursor position broadcasts (20-30 Hz)
Only re-render changed shapes, not entire canvas
Use React.memo to prevent unnecessary component re-renders
Batch Firestore updates where possible


Testing Checklist
Manual Tests (Run Before Submission):

 Open app in 2 browsers, see both cursors moving
 Create shape in browser 1, appears in browser 2 instantly
 Move shape in browser 1, updates in browser 2
 Browser 2 creates shape, appears in browser 1
 User 1 logs out, User 2 still works normally
 All users leave, return later, shapes still present
 Refresh page mid-edit, no data loss
 Create 20 shapes rapidly, no lag or sync issues
 Open 3-4 windows simultaneously, all sync correctly
 Deploy link works on mobile browser (bonus)


Deployment Checklist
Before Deploying:

 Environment variables configured (Firebase keys)
 Build succeeds without warnings
 All console errors fixed
 Firebase security rules configured
 Authentication works in production
 CORS configured if needed

Firebase Hosting Deploy:
bashnpm run build
firebase deploy --only hosting
Verify:

 Public URL accessible
 Can create account and log in
 Canvas loads and functions work
 Share URL with friend to test multiplayer


Out of Scope for MVP (Do NOT Implement)

~~Multiple shape types (stick to one for MVP)~~ - **MOVED TO POST-MVP FINAL BUILD**
Shape rotation
Shape resize
Multi-select
Copy/paste
Undo/redo
Layer management beyond basic create/move
Color picker (use default colors)
Advanced styling options
AI agent (post-MVP feature)
Chat or comments
Export functionality

Focus: Nail the core designer experience and multiplayer sync. Everything else is secondary.

---

## Post-MVP Features - Final Build

### PR #11: Additional Shape Types ✨
**Status:** Planned for Final Build  
**Goal:** Expand canvas capabilities with multiple shape types beyond rectangles

#### Features to Implement:

**Circle Tool**
- Press **C** to activate circle mode
- Click to create circular shapes
- Default radius: 50px
- Same interaction model as rectangles (select, drag, delete)
- Real-time sync across all users

**Triangle Tool**
- Press **T** to activate triangle mode  
- Click to create triangular shapes
- Default size: 100x100px
- Same interaction model as other shapes
- Real-time sync across all users

**Text Tool**
- Press **A** to activate text mode (Add text)
- Click to create text boxes
- Double-click to edit text content
- Default text: "Text" or "Double-click to edit"
- Default font size: 24px
- Same interaction model as other shapes
- Real-time sync including text content

#### Technical Implementation:
- New components: `Circle.tsx`, `Triangle.tsx`, `Text.tsx` in `src/components/canvas/`
- Extended `CanvasObject` type union: `'rectangle' | 'circle' | 'triangle' | 'text'`
- Updated `Shape.tsx` with conditional rendering for all types
- Extended `useCanvas.ts` hook with type-specific creation logic
- New toolbar buttons with keyboard shortcuts (C, T, A)
- Updated keyboard shortcuts modal with new commands
- Full multiplayer sync support (create, move, edit, delete)
- Performance maintained at 60 FPS with 200+ mixed shapes

#### User Experience:
- Seamless switching between tools using keyboard shortcuts
- Consistent visual feedback (selection, hover, drag) across all shape types
- Text editing with intuitive double-click interaction
- All shapes appear instantly for collaborators
- Unified design language across shape types

#### Success Criteria:
✅ All three new shape types fully functional  
✅ Real-time sync works for all shape types  
✅ Performance maintained (60 FPS with 200+ shapes)  
✅ Keyboard shortcuts documented and functional  
✅ Text editing works smoothly  
✅ No regressions in existing rectangle functionality  
✅ Deployed to production with full testing

Risk Mitigation
Top Risks:

Multiplayer sync breaks - Test continuously with multiple windows
Performance degrades - Profile early, optimize as you go
Firebase quotas exceeded - Monitor usage, use free tier wisely
Deployment issues - Deploy early and often
Time management - Cut features aggressively to hit deadline

Contingency Plans:

If Konva.js too heavy → Use Fabric.js or raw Canvas API
If auth takes too long → Use simple username input (no password)
If shapes too complex → Use dots/markers instead
If performance issues → Reduce canvas size or object count limits


Success Criteria
MVP Passes If:
✅ Two users can see each other's cursors in real-time
✅ Shapes created by one user appear for all users instantly
✅ Canvas state persists after refresh
✅ App is deployed and publicly accessible
✅ Authentication works (users have names)
✅ Performance hits 60 FPS targets
✅ No critical bugs in core functionality
MVP Fails If:
❌ Multiplayer sync doesn't work reliably
❌ App not deployed or URL doesn't work
❌ Performance below 30 FPS
❌ Critical bugs (crashes, data loss)
❌ Missing any hard requirements (cursors, presence, auth, shapes, sync)

Next Steps (Post-MVP)
After passing MVP checkpoint:

Add more shape types (circle, text)
Implement resize and rotate
Add multi-select
Build AI agent with function calling
Add complex AI commands
Submit final project