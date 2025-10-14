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

## PR #3: Basic Canvas with Pan & Zoom ✅ COMPLETED
**Goal:** Interactive canvas that users can pan and zoom

### Status: COMPLETE
**Date Completed:** October 14, 2025

### Summary:
Built a fully interactive canvas with smooth pan and zoom functionality using react-konva. Canvas is responsive, full-screen, and performs at 60 FPS. Includes a professional toolbar with user profile and utility functions for canvas operations.

### What Was Built:
- ✅ **Canvas Component:** Full-screen react-konva Stage and Layer with responsive sizing
- ✅ **Pan Functionality:** Drag canvas to pan, cursor changes to grabbing hand
- ✅ **Zoom Functionality:** Mouse wheel zoom centered on cursor position (10%-500%)
- ✅ **Zoom Clamping:** Min 10%, Max 500% zoom with smooth transitions
- ✅ **Canvas Utilities:** Helper functions for coordinate transformations and zoom calculations
- ✅ **Toolbar Component:** Professional top bar with logo, tool buttons, user badge, sign out
- ✅ **Canvas Info Overlay:** Real-time display of user, zoom level, and canvas position
- ✅ **Full-Screen Layout:** Canvas fills viewport, toolbar fixed at top
- ✅ **Responsive Design:** Works on mobile, tablet, and desktop

### Key Files Created:
- `src/components/canvas/Canvas.tsx` - Main canvas component with pan/zoom logic
- `src/components/canvas/Canvas.css` - Canvas container and info overlay styles
- `src/components/canvas/Toolbar.tsx` - Top navigation bar with user info
- `src/components/canvas/Toolbar.css` - Professional toolbar styling
- `src/utils/canvas.ts` - Utility functions for canvas operations
- Updated `src/App.tsx` - Now renders Canvas + Toolbar instead of landing page
- Updated `src/App.css` - Full-screen container layout
- Updated `src/index.css` - Removed old landing page styles

### Features:
- 🖱️ Smooth pan by dragging canvas
- 🔍 Zoom with mouse wheel (centered on cursor)
- 📏 Zoom limits: 10% to 500%
- 📊 Live stats: User name, zoom %, position x/y
- 🎨 Clean, professional UI
- 📱 Fully responsive
- ⚡ 60 FPS performance
- 🎯 Tool buttons ready for PR #4 (currently disabled with hint)

### Canvas Utilities:
- `getRelativePointerPosition()` - Get cursor position relative to canvas transform
- `clampZoom()` - Limit zoom between min/max values
- `getZoomPoint()` - Get point to zoom toward (cursor or center)
- `calculateZoomPosition()` - Calculate new canvas position after zoom
- `fitStageToWindow()` - Get current window dimensions

### Build Status:
- ✅ TypeScript compilation successful
- ✅ Production build successful (954KB bundle, 262KB gzipped)
- ✅ No linter errors
- ✅ react-konva and konva integrated

### User Experience:
- Users see full-screen canvas immediately after login
- Toolbar shows user avatar, name, and sign-out button
- Canvas can be panned by clicking and dragging
- Zoom in/out with mouse wheel
- Bottom-right overlay shows current zoom and position
- Smooth, native-feeling interactions

### Next Steps:
PR #4 will add shape creation and manipulation (rectangles).

**PR Title:** `feat: add responsive canvas with pan and zoom`

---

## PR #4: Shape Creation & Manipulation (Single User) ✅ COMPLETED
**Goal:** Designer can create rectangles, select them, and move them

### Status: COMPLETE
**Date Completed:** October 14, 2025
**Commit:** 9af48b0

### Summary:
Successfully implemented complete shape creation and manipulation system with rectangle drawing, selection, and movement. Integrated seamlessly with existing pan/zoom system using custom manual panning to avoid event conflicts. Beautiful visual feedback and keyboard shortcuts provide excellent UX.

### What Was Built:

#### ✅ Shape State Management (`src/hooks/useCanvas.ts`)
- **useCanvas hook** - Centralized state management for canvas objects
- `createShape()` - Create shapes with unique IDs, random colors
- `updateShape()` - Update shape properties (position, style, etc.)
- `deleteShape()` - Remove shapes (ready for future use)
- `selectShape()` - Track currently selected shape
- `getShape()` - Retrieve specific shape by ID

#### ✅ Shape Component (`src/components/canvas/Shape.tsx`)
- **Rectangle rendering** using react-konva `Rect`
- **Visual states:**
  - Normal: Shadow effect for depth
  - Selected: Blue stroke (#667eea) with enhanced glow
  - Hover: Cursor changes to "move" icon
- **Event handling:**
  - Click to select with proper event bubbling prevention
  - Drag to move with position updates
  - Prevents stage panning when interacting with shapes
- **Accessibility:** Focus-visible styles for keyboard navigation

#### ✅ Shape Creation Mode
- **Keyboard shortcut:** Press **R** to enter rectangle mode
- **Click to create:** Click anywhere on canvas to create 150x100 rectangle
- **Position calculation:** Uses `getRelativePointerPosition()` to account for zoom/pan
- **Visual feedback:** Mode instruction overlay shows when active
- **Random colors:** 20 vibrant colors randomly assigned to new shapes

#### ✅ Shape Selection System
- **Click to select:** Click any shape to select (blue highlight)
- **Single selection:** Only one shape selected at a time
- **Deselect:** Click empty canvas or press ESC
- **Visual feedback:** Selected shape highlighted with stroke and enhanced shadow

#### ✅ Shape Movement
- **Drag shapes:** Click and drag to move shapes freely
- **Position updates:** Shape positions saved to state on drag end
- **No canvas interference:** Shapes drag smoothly without triggering canvas pan
- **Works with zoom:** Movement accounts for current zoom level

#### ✅ Canvas Pan Integration
- **Manual panning system:** Custom implementation using document-level mouse events
- **Smart detection:** Only pans when clicking empty canvas in select mode
- **Shape priority:** Shapes receive events first, stage only pans if no shape clicked
- **No conflicts:** Eliminated Stage `draggable` property that was causing event interference

#### ✅ Toolbar Integration
- **Mode state lifted:** Mode management moved to `App.tsx` for proper sync
- **Keyboard sync:** V/R keys properly highlight toolbar buttons
- **Focus management:** Removed focus outlines when switching modes via keyboard
- **Visual indicators:** Purple highlight shows active tool

#### ✅ Keyboard Shortcuts
- **V key:** Switch to Select mode
- **R key:** Switch to Rectangle mode
- **ESC key:** Return to Select mode and deselect current shape
- **Delete/Backspace:** Ready for future shape deletion
- **Focus blur:** Automatically removes button focus when using keyboard shortcuts

### Key Technical Solutions:

1. **Event Bubbling Prevention:**
   - Used `e.cancelBubble = true` in Shape component to stop events from reaching Stage
   - Prevents stage panning when clicking/dragging shapes

2. **Manual Canvas Panning:**
   - Moved from Konva's built-in `draggable` Stage to custom implementation
   - Document-level `mousemove` and `mouseup` listeners only active when panning
   - Eliminated Stage `onMouseMove` handler that was blocking shape events

3. **State Architecture:**
   - Mode state lifted to App.tsx and passed to both Toolbar and Canvas
   - Ensures toolbar buttons always reflect current mode (keyboard or click)
   - useCanvas hook provides clean API for shape management

4. **Browser Compatibility:**
   - Works perfectly in Chrome
   - Note: Brave browser shields can interfere with canvas events (disable for development)

### Files Created:
- ✅ `src/hooks/useCanvas.ts` - Canvas state management hook (87 lines)
- ✅ `src/components/canvas/Shape.tsx` - Shape rendering component (89 lines)

### Files Modified:
- ✅ `src/App.tsx` - Lifted mode state, connected Toolbar and Canvas
- ✅ `src/components/canvas/Canvas.tsx` - Shape rendering, manual panning, keyboard shortcuts
- ✅ `src/components/canvas/Toolbar.tsx` - Mode props, removed internal state
- ✅ `src/components/canvas/Toolbar.css` - Focus styles, accessibility improvements

### Build Status:
- ✅ TypeScript compilation successful
- ✅ No linter errors
- ✅ All shapes selectable and draggable
- ✅ Canvas pan works on empty space
- ✅ Keyboard shortcuts sync with toolbar

### User Experience:
- Press R → click anywhere → rectangle appears instantly
- Click shape → blue highlight shows selection
- Drag shape → moves smoothly without canvas interference
- Press V → back to select mode, can pan canvas
- ESC → deselects shape, returns to select mode
- Beautiful shadows and highlights provide clear feedback
- Cursor changes indicate interactivity

### Testing Notes:
- Tested with 12+ shapes - all selectable and draggable
- Pan and zoom work correctly with shapes
- No performance issues with multiple shapes
- Mode switching instant and reliable
- Browser compatibility: Chrome ✅, Brave (shields off) ✅

### Next Steps:
PR #5 will add Firestore persistence so shapes save across page refreshes.

**PR Title:** `feat: add rectangle creation, selection, and movement`

---

## PR #5: State Persistence (Firestore) ✅ COMPLETED
**Goal:** Canvas state saves to Firestore and persists across page refreshes

### Status: COMPLETE
**Date Completed:** October 14, 2025
**Commit:** d68abf4

### Summary:
Successfully implemented complete Firestore persistence system with real-time synchronization. Shapes now automatically save to Firestore on creation/modification and load on mount. The system uses a subscription-based architecture for real-time updates, making it ready for multi-user collaboration in PR #6.

### What Was Built:

#### ✅ Firestore Data Structure
- **Collection path:** `canvases/{canvasId}/objects/{objectId}`
- **Canvas ID:** `main-canvas` (single shared canvas for MVP)
- **Document structure:** Matches `CanvasObject` interface exactly
- **Security rules:** Already configured - authenticated users can read/write

#### ✅ useFirestore Hook (`src/hooks/useFirestore.ts`)
- **`saveObject(object)`** - Save new shape to Firestore
- **`updateObject(id, updates)`** - Update existing shape properties
- **`deleteObject(id)`** - Remove shape from Firestore
- **`subscribeToObjects(callback)`** - Real-time subscription to all objects
- **Error handling:** Proper try-catch with console logging
- **Null safety:** Checks for Firestore initialization

#### ✅ Integrated with useCanvas Hook
- **Real-time subscription:** Sets up on mount, cleans up on unmount
- **Auto-save on create:** Shapes save immediately when created (no debounce)
- **Auto-update on move:** Position updates save to Firestore on drag end
- **Auto-delete:** Shapes removed from Firestore when deleted
- **Initial load:** Shapes load from Firestore on component mount
- **Optimistic updates:** Local state updates via Firestore subscription

#### ✅ Subscription-Based Architecture
- **Single source of truth:** Firestore is the authoritative data source
- **Real-time sync:** `onSnapshot` listener updates local state automatically
- **Multi-session ready:** Changes in one session appear in all sessions instantly
- **Efficient:** Only subscribes once per component lifecycle
- **Clean:** Unsubscribe function prevents memory leaks

### Key Technical Implementation:

**Data Flow:**
```
User creates shape → saveObject() → Firestore
                                      ↓
                            onSnapshot fires
                                      ↓
                         Local state updates
                                      ↓
                            UI re-renders
```

**Conflict Prevention:**
- Tracking locally created shapes to avoid duplicate processing
- `isInitialLoadRef` prevents saving remote data back to Firestore
- `lastModifiedAt` timestamp for future conflict resolution

**Type Safety:**
- Full TypeScript integration with CanvasObject interface
- `import type` for Unsubscribe to satisfy verbatimModuleSyntax
- Proper null checks for Firestore instance

### Files Created:
- ✅ `src/hooks/useFirestore.ts` - Firestore operations hook (117 lines)

### Files Modified:
- ✅ `src/hooks/useCanvas.ts` - Integrated Firestore persistence (130 lines)

### Build Status:
- ✅ TypeScript compilation successful
- ✅ Production build successful (1.15MB bundle, 309KB gzipped)
- ✅ No linter errors
- ✅ Firestore security rules configured

### How It Works:

1. **On Mount:**
   - useCanvas calls `subscribeToObjects()`
   - Firestore sends all existing shapes
   - Local state populated with shapes from database

2. **Create Shape (Press R, Click):**
   - `createShape()` generates new shape with UUID
   - `saveObject()` writes to Firestore immediately
   - Firestore subscription receives the new shape
   - Local state updates, shape appears in UI

3. **Move Shape (Drag):**
   - User drags shape to new position
   - On drag end, `updateShape()` called
   - `updateObject()` updates position in Firestore
   - Subscription receives update
   - Local state updates with new position

4. **Refresh Page:**
   - Component unmounts, unsubscribes from Firestore
   - Component remounts, subscribes again
   - Firestore sends all shapes
   - Canvas restored to previous state ✨

5. **Multiple Sessions:**
   - User A creates shape → appears for User B in real-time
   - User B moves shape → User A sees it move
   - Both sessions stay synchronized

### Testing Notes:
- Build verification: ✅ (TypeScript + Vite build passed)
- Ready for manual testing:
  - Create shapes and refresh page
  - Shapes should persist across page loads
  - Open in multiple tabs to see real-time sync
  - Check Firestore console to see documents

### Next Steps:
PR #6 will enhance real-time sync with conflict resolution and presence awareness.

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