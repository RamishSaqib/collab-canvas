# CollabCanvas MVP - Task Checklist & PR Plan

## Project File Structure

```
collab-canvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthWrapper.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── Shape.tsx
│   │   │   ├── Cursor.tsx
│   │   │   └── Toolbar.tsx
│   │   └── presence/
│   │       └── PresenceList.tsx
│   ├── hooks/
│   │   ├── useCanvas.ts
│   │   ├── useFirestore.ts
│   │   ├── useCursors.ts
│   │   └── usePresence.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── types.ts
│   ├── utils/
│   │   └── canvas.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   └── canvas.test.ts
│   │   └── hooks/
│   │       └── useCanvas.test.ts
│   ├── integration/
│   │   ├── shape-creation.test.tsx
│   │   ├── shape-sync.test.tsx
│   │   └── multiplayer-cursors.test.tsx
│   └── setup.ts
├── .env.local
├── .env.example
├── .gitignore
├── firebase.json
├── .firebaserc
├── firestore.rules
├── database.rules.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

---

## PR #1: Project Setup & Deployment Pipeline ✅ COMPLETED
**Goal:** Get a deployable "Hello World" with Firebase configured

### Status: COMPLETE
**Date Completed:** October 14, 2025

### Summary:
Successfully set up the complete development foundation for CollabCanvas MVP. All core dependencies installed, Firebase fully configured with security rules, testing infrastructure ready, and comprehensive documentation created.

### What Was Built:
- ✅ **Project Structure:** Vite + React 19 + TypeScript with HMR
- ✅ **Dependencies:** react-konva, konva, firebase, vitest, testing-library
- ✅ **Firebase Configuration:** Auth, Firestore, Realtime DB initialized with security rules
- ✅ **Deployment Pipeline:** firebase.json, firestore.rules, database.rules.json configured
- ✅ **App Shell:** Beautiful gradient UI with Firebase connection status display
- ✅ **Testing Infrastructure:** Vitest configured with jsdom, test scripts ready
- ✅ **Documentation:** README.md, TROUBLESHOOTING.md, FIREBASE-SETUP-REVIEW.md
- ✅ **Environment Setup:** env.example and firebaserc.example templates created

### Key Files Created:
- `src/lib/firebase.ts` - Firebase initialization with error handling
- `src/lib/types.ts` - Complete TypeScript interfaces
- `firebase.json`, `firestore.rules`, `database.rules.json` - Production-ready security
- `vitest.config.ts`, `tests/setup.ts` - Testing infrastructure
- `env.example`, `firebaserc.example` - Configuration templates
- `.gitignore` - Proper exclusions for security

### Build Status:
- ✅ TypeScript compilation successful
- ✅ Production build successful (615KB bundle)
- ✅ No linter errors
- ✅ Dev server running on localhost

### Next Steps:
PR #2 will implement the authentication system with email/password and Google OAuth.

**PR Title:** `feat: initial project setup with Firebase and deployment pipeline`

---

## PR #2: Authentication System ✅ COMPLETED
**Goal:** Users can sign up/log in with email/password or Google OAuth

### Status: COMPLETE
**Date Completed:** October 14, 2025

### Summary:
Built a complete authentication system with email/password and Google OAuth. Users must authenticate before accessing the app. Beautiful, production-ready auth UI with proper error handling and session persistence.

### What Was Built:
- ✅ **Authentication Functions:** signUpWithEmail(), signInWithEmail(), signInWithGoogle(), signOut()
- ✅ **LoginForm Component:** Email/password fields with Google OAuth button
- ✅ **SignupForm Component:** Full validation with password confirmation
- ✅ **AuthWrapper Component:** Route protection with auth state management
- ✅ **User Profile Display:** Avatar with color, name, email, and sign-out button
- ✅ **Beautiful UI:** Modern glassmorphism design with gradient backgrounds
- ✅ **Error Handling:** User-friendly error messages for all auth scenarios
- ✅ **Session Persistence:** Users stay logged in across page refreshes

### Key Files Created:
- `src/lib/firebase.ts` - Authentication helper functions with user color generation
- `src/components/auth/AuthWrapper.tsx` - Protected route wrapper with loading state
- `src/components/auth/LoginForm.tsx` - Login form with email/password and Google OAuth
- `src/components/auth/SignupForm.tsx` - Signup form with validation
- `src/components/auth/AuthForms.css` - Beautiful, responsive auth UI styles
- `ENABLE-AUTH.md` - Step-by-step guide to enable auth in Firebase Console

### Features:
- 🔐 Email/password authentication with validation
- 🔐 Google OAuth with popup flow
- 🎨 Consistent user colors for multiplayer (based on user ID)
- 💾 Automatic session persistence
- 🛡️ Protected routes - must be logged in to access app
- 🎯 User profile display with avatar
- 📱 Fully responsive design
- ⚡ Loading states and error handling

### Build Status:
- ✅ TypeScript compilation successful
- ✅ Production build successful (636KB bundle)
- ✅ No linter errors
- ✅ All components type-safe

### Testing Requirements:
Before testing, enable authentication in Firebase Console (see `ENABLE-AUTH.md`):
1. Enable Email/Password authentication
2. Enable Google OAuth authentication
3. Test signup, login, logout, and session persistence

### Next Steps:
PR #3 will implement the interactive canvas with pan and zoom functionality.

**PR Title:** `feat: add email/password and Google OAuth authentication`

---

## PR #3: Basic Canvas with Pan & Zoom
**Goal:** Interactive canvas that users can pan and zoom

### Tasks:
- [ ] Create Canvas component
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Set up react-konva `Stage` and `Layer`
  - Make canvas dynamic/responsive to window size

- [ ] Implement pan functionality
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Drag canvas to pan (don't use shapes for this, use Stage draggable)
  - Update canvas offset state

- [ ] Implement zoom functionality
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Mouse wheel to zoom in/out
  - Zoom centered on cursor position
  - Clamp zoom levels (min/max)

- [ ] Add canvas utilities
  - **Files:** `src/utils/canvas.ts`
  - Helper functions: `getRelativePointerPosition()`, `clampZoom()`, etc.

- [ ] **Write unit tests for canvas utilities**
  - **Files:** `tests/unit/utils/canvas.test.ts`
  - Test `getRelativePointerPosition()` with various inputs
  - Test `clampZoom()` boundary conditions
  - Test any coordinate transformation functions
  - **Verification:** All utility functions work correctly with edge cases

- [ ] Create basic Toolbar component
  - **Files:** `src/components/canvas/Toolbar.tsx`
  - Top bar layout
  - Placeholder for shape creation button (not functional yet)

- [ ] Integrate Canvas into App
  - **Files:** `src/App.tsx`
  - Render Canvas component
  - Render Toolbar above Canvas

- [ ] Add basic styling
  - **Files:** `src/index.css`
  - Full-screen canvas layout
  - Toolbar styling (top bar)

- [ ] Test performance
  - Verify 60 FPS during pan/zoom
  - Test on different screen sizes
  - Check responsiveness

**PR Title:** `feat: add responsive canvas with pan and zoom`

---

## PR #4: Shape Creation & Manipulation (Single User)
**Goal:** Designer can create rectangles, select them, and move them

### Tasks:
- [ ] Define shape types
  - **Files:** `src/lib/types.ts`
  - Create `CanvasObject` interface (id, type, x, y, width, height, fill, etc.)

- [ ] Create Shape component
  - **Files:** `src/components/canvas/Shape.tsx`
  - Render rectangle using react-konva `Rect`
  - Handle click to select
  - Handle drag to move
  - Show highlight when selected (stroke or opacity change)

- [ ] Implement shape creation logic
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Click mode: click on canvas to create rectangle at that position
  - Generate unique IDs for shapes (use `crypto.randomUUID()`)
  - Add shape to local state

- [ ] Add shape creation button to Toolbar
  - **Files:** `src/components/canvas/Toolbar.tsx`
  - Button to enter "create rectangle" mode
  - Visual indicator when in creation mode

- [ ] Implement shape selection
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Track selected shape ID in state
  - Click on shape to select
  - Click on empty canvas to deselect

- [ ] Implement shape movement
  - **Files:** `src/components/canvas/Shape.tsx`
  - Make shapes draggable
  - Update shape position in state on drag end
  - Prevent canvas pan when dragging shape

- [ ] Create canvas state management hook
  - **Files:** `src/hooks/useCanvas.ts`
  - Manage shapes array
  - Manage selected shape ID
  - Functions: `createShape()`, `updateShape()`, `deleteShape()`

- [ ] **Write unit tests for useCanvas hook**
  - **Files:** `tests/unit/hooks/useCanvas.test.ts`
  - Test `createShape()` generates unique IDs and adds to array
  - Test `updateShape()` modifies correct shape
  - Test `deleteShape()` removes shape
  - Test `selectShape()` updates selected ID
  - Test edge cases (delete non-existent shape, update with invalid data)
  - **Verification:** Core canvas state logic is bulletproof

- [ ] **Write integration test for shape creation flow**
  - **Files:** `tests/integration/shape-creation.test.tsx`
  - Test complete flow: click toolbar → click canvas → shape appears
  - Verify shape has correct properties (position, size, color)
  - Test creating multiple shapes
  - Test that shapes are selectable after creation
  - **Verification:** End-to-end shape creation works correctly

- [ ] Test shape interactions
  - Create multiple rectangles
  - Select and move different shapes
  - Verify no conflicts between pan and shape drag
  - Test performance with 20+ shapes

**PR Title:** `feat: add rectangle creation, selection, and movement`

---

## PR #5: State Persistence (Firestore)
**Goal:** Canvas state saves to Firestore and persists across page refreshes

### Tasks:
- [ ] Design Firestore data structure
  - **Files:** `firestore.rules`
  - Collection: `canvases/{canvasId}/objects/{objectId}`
  - Document structure matches `CanvasObject` type

- [ ] Create Firestore hook
  - **Files:** `src/hooks/useFirestore.ts`
  - `saveObject()` - save shape to Firestore
  - `updateObject()` - update existing shape
  - `deleteObject()` - remove shape
  - `subscribeToObjects()` - listen to all objects in canvas

- [ ] Implement save on shape creation
  - **Files:** `src/hooks/useCanvas.ts`
  - When shape created → call `saveObject()`
  - Immediate save (no debounce)

- [ ] Implement save on shape movement
  - **Files:** `src/components/canvas/Shape.tsx`
  - On drag end → call `updateObject()` with new position

- [ ] Implement load on mount
  - **Files:** `src/hooks/useCanvas.ts`
  - On component mount → fetch all objects from Firestore
  - Populate local state with fetched objects

- [ ] Set up canvas ID system
  - **Files:** `src/App.tsx`
  - For MVP, use single shared canvas ID (e.g., "main-canvas")
  - Store in constant or context

- [ ] Configure Firestore security rules
  - **Files:** `firestore.rules`
  - Allow authenticated users to read/write canvas objects
  - Deny unauthenticated access

- [ ] **Write integration test for persistence**
  - **Files:** `tests/integration/shape-persistence.test.tsx`
  - Mock Firestore with in-memory implementation
  - Test: Create shape → verify saved to Firestore
  - Test: Modify shape → verify update in Firestore
  - Test: Load canvas → verify shapes fetched from Firestore
  - Test: Multiple shapes persist correctly
  - **Verification:** Firestore save/load cycle works correctly

- [ ] Test persistence
  - Create shapes
  - Refresh page → shapes still there
  - Open in incognito → shapes visible (after login)
  - Test with multiple shapes (50+)

**PR Title:** `feat: add Firestore persistence for canvas state`

---

## PR #6: Real-Time Object Sync
**Goal:** Multiple users see each other's shape creations and movements in real-time

### Tasks:
- [ ] Update Firestore hook for real-time listening
  - **Files:** `src/hooks/useFirestore.ts`
  - Replace fetch with `onSnapshot()` listener
  - Handle document added/modified/removed events

- [ ] Integrate real-time listener in Canvas
  - **Files:** `src/hooks/useCanvas.ts`
  - Subscribe to Firestore changes on mount
  - Update local state when remote changes detected
  - Unsubscribe on unmount

- [ ] Handle create events from other users
  - **Files:** `src/hooks/useCanvas.ts`
  - When new object added → add to local state
  - Ignore if object already exists (created by current user)

- [ ] Handle update events from other users
  - **Files:** `src/hooks/useCanvas.ts`
  - When object modified → update local state
  - Merge changes without overwriting local pending changes

- [ ] Handle delete events from other users
  - **Files:** `src/hooks/useCanvas.ts`
  - When object removed → remove from local state

- [ ] Implement conflict resolution (last write wins)
  - **Files:** `src/hooks/useFirestore.ts`
  - Add timestamp to each write
  - Document strategy in code comments

- [ ] Optimize sync performance
  - **Files:** `src/hooks/useFirestore.ts`
  - Only sync changed fields (delta updates)
  - Batch multiple updates if needed

- [ ] **Write integration test for real-time sync**
  - **Files:** `tests/integration/shape-sync.test.tsx`
  - Mock two users with separate Firestore instances
  - Test: User 1 creates shape → User 2 receives update
  - Test: User 2 moves shape → User 1 sees movement
  - Test: Simultaneous edits → last write wins
  - Test: Sync latency is acceptable (< 100ms in mock)
  - **Verification:** Multi-user synchronization logic works correctly

- [ ] Test multi-user object sync
  - Open 2 browser windows (different accounts)
  - Create shape in window 1 → appears in window 2
  - Move shape in window 2 → updates in window 1
  - Test with simultaneous edits
  - Verify <100ms sync latency

**PR Title:** `feat: add real-time object synchronization across users`

---

## PR #7: Multiplayer Cursors
**Goal:** Users see each other's cursor positions with name labels in real-time

### Tasks:
- [ ] Design Realtime Database structure for cursors
  - **Files:** `database.rules.json`
  - Path: `cursors/{canvasId}/{userId}` → `{x, y, userName, color, timestamp}`

- [ ] Create Cursor component
  - **Files:** `src/components/canvas/Cursor.tsx`
  - Render cursor indicator (SVG arrow or circle)
  - Show name label next to cursor
  - Use user's assigned color

- [ ] Create cursor tracking hook
  - **Files:** `src/hooks/useCursors.ts`
  - Track local mouse position
  - Broadcast position to Realtime Database (throttled to 30 updates/sec)
  - Subscribe to other users' cursor positions
  - Return array of other users' cursors

- [ ] Integrate cursor tracking in Canvas
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Track mouse move events
  - Call `useCursors()` hook
  - Render `Cursor` component for each remote user

- [ ] Implement cursor throttling
  - **Files:** `src/hooks/useCursors.ts`
  - Use throttle to limit updates (e.g., every 33ms for ~30 Hz)
  - Balance between smoothness and bandwidth

- [ ] Assign colors to users
  - **Files:** `src/lib/firebase.ts` or `src/utils/canvas.ts`
  - Generate random color on user creation
  - Store in user profile or derive from userId

- [ ] Configure Realtime Database security rules
  - **Files:** `database.rules.json`
  - Allow authenticated users to read/write cursor positions
  - Auto-cleanup on disconnect (use `onDisconnect()`)

- [ ] **Write integration test for cursor sync**
  - **Files:** `tests/integration/multiplayer-cursors.test.tsx`
  - Mock Realtime Database
  - Test: User 1 moves mouse → cursor position updates
  - Test: User 2 receives User 1's cursor updates
  - Test: Throttling works (not every mouse move is synced)
  - Test: Cursor removed on user disconnect
  - Test: Multiple cursors (3+ users) all sync correctly
  - **Verification:** Cursor synchronization and throttling work correctly

- [ ] Test cursor sync
  - Open 2 windows → see both cursors
  - Move mouse → other window's cursor follows smoothly
  - Verify <50ms latency
  - Test with 3-4 users simultaneously

**PR Title:** `feat: add real-time multiplayer cursors with name labels`

---

## PR #8: Presence Awareness
**Goal:** Show who's currently online in the canvas session

### Tasks:
- [ ] Design presence data structure
  - **Files:** `database.rules.json`
  - Path: `presence/{canvasId}/{userId}` → `{userName, color, lastSeen}`

- [ ] Create PresenceList component
  - **Files:** `src/components/presence/PresenceList.tsx`
  - Sidebar showing list of online users
  - Display user name and colored indicator
  - Show "You" for current user

- [ ] Create presence tracking hook
  - **Files:** `src/hooks/usePresence.ts`
  - On mount → add self to presence
  - Set up `onDisconnect()` to remove on disconnect
  - Subscribe to presence changes
  - Update lastSeen timestamp periodically (every 30s)
  - Return array of online users

- [ ] Integrate presence in App
  - **Files:** `src/App.tsx`
  - Render `PresenceList` component (sidebar or corner)
  - Call `usePresence()` hook

- [ ] Handle user disconnect/reconnect
  - **Files:** `src/hooks/usePresence.ts`
  - Use Firebase `onDisconnect()` to auto-remove
  - Re-add on reconnect
  - Clean up stale entries (lastSeen > 1 minute ago)

- [ ] Add styling for presence list
  - **Files:** `src/index.css`
  - Fixed sidebar or floating panel
  - User avatars (colored circles with initials)
  - Responsive on mobile

- [ ] Test presence system
  - Open 3 windows → see 3 users online
  - Close one window → user disappears from list
  - Disconnect network → reconnect → user reappears
  - Verify real-time updates

**PR Title:** `feat: add presence awareness showing online users`

---

## PR #9: Performance Optimization & Testing
**Goal:** Ensure 60 FPS and meet all performance targets

### Tasks:
- [ ] Optimize canvas rendering
  - **Files:** `src/components/canvas/Canvas.tsx`, `src/components/canvas/Shape.tsx`
  - Use `React.memo()` to prevent unnecessary re-renders
  - Optimize Konva layer management

- [ ] Optimize Firestore queries
  - **Files:** `src/hooks/useFirestore.ts`
  - Use indexed queries if needed
  - Minimize reads (cache locally when possible)

- [ ] Add loading states
  - **Files:** `src/App.tsx`, `src/components/canvas/Canvas.tsx`
  - Show spinner while loading canvas state
  - Show "connecting" state for presence/cursors

- [ ] Test with 500+ objects
  - Create test script to generate objects
  - Verify FPS stays above 60
  - Optimize if performance degrades

- [ ] Test with 5+ concurrent users
  - Open 5 browser windows
  - Perform simultaneous actions
  - Verify no lag or sync issues
  - Monitor Firebase quota usage

- [ ] Test reconnection scenarios
  - Disconnect network mid-edit
  - Reconnect after 30 seconds
  - Verify no data loss
  - Test with multiple users disconnecting

- [ ] Add error handling
  - **Files:** Throughout all components
  - Handle Firebase errors gracefully
  - Show user-friendly error messages
  - Retry failed operations

- [ ] Performance profiling
  - Use React DevTools profiler
  - Use Chrome DevTools performance tab
  - Identify and fix bottlenecks

**PR Title:** `perf: optimize rendering and sync for 60 FPS and multi-user load`

---

## PR #10: Final Polish & Documentation
**Goal:** Production-ready MVP with complete documentation

### Tasks:
- [ ] Add delete shape functionality
  - **Files:** `src/hooks/useCanvas.ts`, `src/components/canvas/Canvas.tsx`
  - Delete key or toolbar button to remove selected shape
  - Sync delete to Firestore

- [ ] Add keyboard shortcuts
  - **Files:** `src/components/canvas/Canvas.tsx`
  - Delete key → delete selected shape
  - Esc key → deselect shape
  - Document shortcuts in UI

- [ ] Improve visual design
  - **Files:** `src/index.css`, component styles
  - Professional color scheme
  - Clean toolbar design
  - Better selection highlight
  - Polish cursor and presence UI

- [ ] Add user feedback
  - **Files:** Various components
  - Toast notifications for errors
  - Visual feedback for actions (shape created, saved, etc.)

- [ ] Complete README documentation
  - **Files:** `README.md`
  - Project overview
  - Setup instructions (detailed)
  - Environment variables guide
  - Deployment steps
  - Architecture overview
  - Tech stack explanation
  - Known limitations

- [ ] Create demo video (3-5 min)
  - Show authentication
  - Demonstrate shape creation
  - Show real-time collaboration (multiple windows)
  - Demonstrate cursors and presence
  - Explain architecture briefly

- [ ] Final testing checklist
  - Run through all MVP requirements
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on mobile (basic responsiveness)
  - Verify all acceptance criteria

- [ ] Final deployment
  - Deploy to Firebase Hosting
  - Test production URL
  - Share URL with team/evaluators

**PR Title:** `chore: final polish, documentation, and production deployment`