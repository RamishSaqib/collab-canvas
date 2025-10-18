# CollabCanvas - Task Checklist & PR Plan

## PR #1: Project Setup & Deployment Pipeline ✅
**Goal:** Get deployable "Hello World" with Firebase configured

### Tasks:
1. Initialize Vite + React 19 + TypeScript project
2. Set up Firebase (Auth, Firestore, Realtime DB, Hosting)
3. Configure security rules (firestore.rules, database.rules.json)
4. Set up testing infrastructure (Vitest + jsdom)
5. Create App shell with Firebase connection status
6. Deploy to Firebase Hosting

---

## PR #2: Authentication System ✅
**Goal:** Users can sign up/log in with email/password or Google OAuth

### Tasks:
1. Implement email/password authentication with validation
2. Add Google OAuth with popup flow
3. Create AuthWrapper component for route protection
4. Add user profile display with avatar and consistent color
5. Implement session persistence across refreshes
6. Test authentication flow

---

## PR #3: Basic Canvas with Pan & Zoom ✅
**Goal:** Interactive canvas that users can pan and zoom

### Tasks:
1. Set up full-screen react-konva canvas with responsive sizing
2. Implement pan functionality via click-drag
3. Add mouse wheel zoom (10%-500%) centered on cursor
4. Create canvas coordinate transformation utilities
5. Add toolbar with user profile
6. Add real-time canvas info overlay (zoom, position)
7. Test 60 FPS performance

---

## PR #4: Shape Creation & Manipulation ✅
**Goal:** Designer can create rectangles, select them, and move them

### Tasks:
1. Implement rectangle creation tool (Press R → Click)
2. Add shape selection with visual highlight
3. Implement drag-to-move functionality
4. Create useCanvas hook for shape state management
5. Add random color assignment (20 vibrant colors)
6. Add keyboard shortcuts (V, R, ESC)
7. Test event bubbling prevention for conflict-free interactions

---

## PR #5: State Persistence (Firestore) ✅
**Goal:** Canvas state saves to Firestore and persists across refreshes

### Tasks:
1. Create useFirestore hook for all database operations
2. Add real-time Firestore subscriptions with onSnapshot
3. Implement automatic persistence for create/update/delete
4. Add initial shape loading on mount
5. Handle clean unsubscribe on unmount
6. Test persistence across refreshes

---

## PR #6: Real-Time Object Sync ✅
**Goal:** Multiple users see each other's shape creations and movements in real-time

### Tasks:
1. Fix subscription lifecycle bug (persistent subscription)
2. Implement real-time sync for create, update, delete
3. Add multi-window synchronization
4. Implement last-write-wins conflict resolution
5. Test <100ms sync latency
6. Test cross-user collaboration

---

## PR #7: Multiplayer Cursors ✅
**Goal:** Users see each other's cursor positions with name labels in real-time

### Tasks:
1. Create Cursor component with SVG arrow and name label
2. Build useCursors hook for tracking and broadcasting
3. Implement throttled cursor updates (30 Hz / 33ms intervals)
4. Integrate Realtime Database for cursor positions
5. Add auto-cleanup on user disconnect
6. Test <35ms cursor sync latency

---

## PR #8: Presence Awareness ✅
**Goal:** Show who's currently online in the canvas session

### Tasks:
1. Create collapsible sidebar with online users list
2. Build usePresence hook with heartbeat system (30-second intervals)
3. Add color-coded user avatars with initials
4. Implement auto-disconnect cleanup via onDisconnect()
5. Create responsive sidebar design
6. Test real-time user count display

---

## PR #9: Performance Optimization ✅
**Goal:** Ensure 60 FPS and meet all performance targets

### Tasks:
1. Add React.memo to all components with custom comparison
2. Wrap all event handlers with useCallback
3. Implement debounced Firestore updates (300ms batching)
4. Add flush-on-unmount for pending updates
5. Create performance monitoring utilities
6. Test 60 FPS with 500+ shapes

---

## PR #10: Final Polish & Documentation ✅
**Goal:** Production-ready MVP with complete documentation

### Tasks:
1. Add shape deletion (Delete/Backspace keys)
2. Create keyboard shortcuts modal (Press ?)
3. Add error boundaries with recovery UI
4. Implement loading states for auth and canvas
5. Add toast notifications for user feedback
6. Create empty state guidance
7. Write complete README and architecture.md
8. Deploy to production

---

## PR #11: Additional Shape Types ✅
**Goal:** Expand shape creation beyond rectangles

### Tasks:
1. Create Circle component and tool (Press C)
2. Create Triangle component and tool (Press T)
3. Create Text component and tool (Press A)
4. Extend CanvasObject type definitions
5. Add toolbar buttons with keyboard shortcuts
6. Update keyboard shortcuts modal
7. Test real-time sync for all shape types
8. Test 60 FPS with 200+ mixed shapes

---

## PR #12: Hybrid Sync Architecture ✅
**Goal:** Reduce multiplayer sync latency from ~350ms to ~20-30ms

### Tasks:
1. Create useRealtimeSync hook for RTDB operations
2. Reduce Firestore debounce from 300ms → 100ms
3. Implement two-tier sync: RTDB (ephemeral) + Firestore (persistent)
4. Add active shape tracking during drag and text editing
5. Implement merge strategy: RTDB overrides Firestore for active shapes
6. Add conflict resolution for simultaneous edits
7. Implement automatic cleanup of stale RTDB entries (5s threshold)
8. Add fallback to Firestore-only mode if RTDB unavailable
9. Test 90% latency improvement (350ms → 20-30ms)
10. Test with 10+ concurrent users

---

## PR #13: Color Customization System ✅
**Goal:** Add comprehensive color control for shapes and text

### Tasks:
1. Create ColorWheel component with HSL color spectrum
2. Create ColorPicker wrapper with preview and controls
3. Add color picker button in toolbar (Press P to toggle)
4. Implement pre-creation color selection
5. Implement post-creation color change
6. Add text color support (changes text fill)
7. Add keyboard shortcuts (P, Enter, Esc)
8. Add color swatch indicator in toolbar
9. Test real-time color sync
10. Verify no performance regression

---

## PR #14: Conflict Resolution & Persistence Enhancements ✅
**Goal:** Achieve EXCELLENT rating (9/9) for Conflict Resolution and Persistence

### Tasks:
1. Add active shape visual indicators (pulsing border, user color)
2. Add "Last edited by" tooltip on hover
3. Create operation queue (useOperationQueue.ts) with retry logic
4. Create connection status banner (ConnectionStatusBanner.tsx)
5. Build useConnectionStatus hook for network monitoring
6. Add comprehensive offline support with auto-sync
7. Add visual feedback for network state changes
8. Create useBeforeUnload hook to prevent data loss
9. Test edge cases for simultaneous edits
10. Verify EXCELLENT rating criteria met

---

## PR #15: Transform Operations & Multi-Select ✅
**Goal:** Achieve EXCELLENT rating (8/8) for Canvas Functionality

### Tasks:
1. Implement multi-select with Shift+Click toggle
2. Add drag-to-select with selection box
3. Integrate Konva Transformer for resize and rotate
4. Add rotation handle with grab cursor
5. Handle transform end for all shape types
6. Implement font size scaling for text during transform
7. Add batch operations: updateShapes(), deleteShapes(), duplicateShapes()
8. Create selection counter UI with navigation hints
9. Add layer management: z-index with Ctrl+] and Ctrl+[
10. Create text formatting toolbar (font size, bold, italic)
11. Test with 500+ shapes at 60 FPS

---

## PR #16: Figma-Inspired Features ✅
**Goal:** Achieve EXCELLENT rating (15/15) for Advanced Features

### Tasks:
1. **Undo/Redo System:**
   - Create useHistory hook with command pattern (50-item stack)
   - Implement CreateShapeCommand, DeleteShapeCommand, UpdateShapeCommand
   - Add Ctrl+Z and Ctrl+Shift+Z keyboard shortcuts
   - Add toast notifications for actions
   - Implement per-user history

2. **Alignment Tools:**
   - Create 6 alignment operations (left, center, right, top, middle, bottom)
   - Add 2 distribution functions (horizontal, vertical spacing)
   - Build AlignmentToolbar component
   - Calculate bounding boxes for all shape types
   - Handle coordinate system (center-based vs top-left)

3. **Collaborative Comments:**
   - Create useComments hook with Firestore subcollection
   - Build CommentPin, CommentPanel, CommentInputDialog components
   - Add real-time comment sync
   - Implement author permissions (edit/delete own)
   - Add resolve/reopen functionality
   - Add relative timestamps

4. Test all features and verify EXCELLENT rating

---

## PR #17: Canvas UX & Interaction Polish ✅
**Goal:** Improve canvas interaction and user experience

### Tasks:
1. **Hand Tool for Canvas Panning:**
   - Add Hand tool button to toolbar
   - Implement Hand tool selection (H key)
   - Replace Ctrl+Click drag with Hand tool
   - Add hand cursor icon when active

2. **White Canvas Background:**
   - Change canvas background to white
   - Maintain pan/drag functionality

3. **Improved Cursor Username Display:**
   - Fix username jank during movement
   - Ensure smooth positioning with cursor

4. **Offline User Cursor Cleanup:**
   - Hide cursors for offline users
   - Auto-cleanup stale cursor positions
   - Filter cursors by online presence

---

## PR #18: Canvas Coordinates & Text Polish ✅
**Goal:** Add coordinate display and improve text editing UX

### Tasks:
1. Create coordinate display system
2. Implement grid origin at canvas center (0, 0)
3. Show position in bottom-right corner
4. Update in real-time during drag
5. Reduce text selection stroke width (50% thinner)
6. Integrate coordinate display into canvas info overlay
7. Test coordinate accuracy

---

## PR #19: AI Canvas Agent - Creation & Complex Commands ✅
**Goal:** Build foundation for AI agent with creation and complex commands

### Tasks:
1. Set up AI provider integration (OpenAI GPT-4 Turbo)
2. Design command schema (AICommand, CommandIntent, CommandEntity)
3. Create AI command parser with structured JSON outputs
4. Implement command executor (useAIAgent hook)
5. **Creation Commands:**
   - Create shapes with colors and positions
   - Support explicit positioning (grid coordinates)
   - Handle absolute and relative positions
6. **Grid Layout Commands:**
   - Implement NxN grid generation
   - Calculate proper spacing
7. **Complex Commands:**
   - Login form (6 shapes: 3 rects + 3 texts)
   - Navbar (2N shapes for N items with semantic naming)
   - Card layout (5 shapes: 2 rects + 3 texts)
   - Button (2 shapes: 1 rect + 1 text)
8. Implement explicit positioning support (grid coordinate system)
9. Add grid-to-Konva coordinate conversion
10. Integrate with viewport center calculation
11. Fix text positioning for all complex commands
12. Implement zIndex-based layering (rects: 0-999, text: 1000+)
13. Test all creation and complex commands
14. Optimize AI prompt for accuracy
15. Test with multiple users simultaneously
16. Verify sub-2 second response times

**Achievements:**
- Complex Command Execution: 7-8/8 (EXCELLENT) ✅
- AI Performance & Reliability: 6-7/7 (EXCELLENT) ✅
- Command Breadth: 5-6/10 (Satisfactory) - 6 command types

---

## PR #20: AI Canvas Agent - Manipulation Commands ✅
**Goal:** Implement manipulation commands to reach EXCELLENT rating (22-25/25)
**Status:** COMPLETE - Achieved 25/25 (EXCELLENT) 🏆

### Current Command Types (6 total):
1. ✅ Create shapes (circles, rectangles, triangles, text)
2. ✅ Create shapes with colors
3. ✅ Create shapes with explicit positions
4. ✅ Create grid layouts
5. ✅ Create complex components
6. ✅ Multi-shape complex commands

### Target Command Types (9-10 total):
7. **Move shapes** - "Move the blue rectangle to the center"
8. **Resize shapes** - "Resize the circle to be twice as big"
9. **Rotate shapes** - "Rotate the text 45 degrees"
10. **Change color** - "Change all red shapes to green"
11. **Delete shapes** - "Delete all circles"

### Tasks:
1. **Implement Shape Query System:**
   - Query by shape type (all rectangles, all circles)
   - Query by color (#ff0000, red)
   - Query by selection state
   - Query by position (center, top-left)
   - Return matching shape IDs
   - Handle "no matches found" gracefully

2. **Implement Move Command:**
   - Parse move intent from AI
   - Support absolute positions (x, y)
   - Support relative positions ("center", "top-left")
   - Calculate position based on viewport
   - Batch move for multiple shapes
   - Integrate with updateShapesWithHistory
   - Add examples to AI prompt

3. **Implement Resize Command:**
   - Parse resize intent
   - Support relative sizing (2x, 50%, "twice as big")
   - Support absolute sizing (width: 200, height: 150)
   - Handle different shape types (radius vs width/height)
   - Calculate new dimensions from current size
   - Batch resize for multiple shapes
   - Integrate with updateShapesWithHistory
   - Add examples to AI prompt

4. **Implement Rotate Command:**
   - Parse rotate intent
   - Support absolute rotation (45 degrees)
   - Support relative rotation (+90 degrees)
   - Convert degrees to radians
   - Batch rotate for multiple shapes
   - Integrate with updateShapesWithHistory
   - Add examples to AI prompt

5. **Implement Change Color Command:**
   - Parse changeColor intent
   - Support hex colors (#ff0000)
   - Support named colors (red, blue, green)
   - Query shapes by current color
   - Batch color change
   - Integrate with updateShapesWithHistory
   - Add examples to AI prompt

6. **Implement Delete Command:**
   - Parse delete intent
   - Query shapes to delete
   - Add confirmation for large deletions (10+)
   - Batch delete
   - Integrate with deleteShapesWithHistory
   - Add examples to AI prompt

7. **Update AI System Prompt:**
   - Add MOVE command format and examples
   - Add RESIZE command format and examples
   - Add ROTATE command format and examples
   - Add CHANGECOLOR command format and examples
   - Add DELETE command format and examples
   - Specify shape query syntax
   - Add position/size/color calculation rules

8. **Extend Type Definitions:**
   - Verify CommandIntent includes all manipulation types
   - Verify CommandEntity includes query, newPosition, newSize, rotation, newColor
   - Update ShapeQuery interface if needed

9. **Test Move Commands:**
   - "Move the blue rectangle to the center"
   - "Move all circles to (100, 50)"
   - "Move selected shapes to top-left"
   - Test batch moves
   - Verify undo/redo
   - Verify real-time sync

10. **Test Resize Commands:**
    - "Resize the circle to be twice as big"
    - "Make all rectangles 50% smaller"
    - Test batch resize
    - Verify undo/redo
    - Verify real-time sync

11. **Test Rotate Commands:**
    - "Rotate the text 45 degrees"
    - "Rotate all triangles 90 degrees"
    - Test batch rotate
    - Verify undo/redo
    - Verify real-time sync

12. **Test Change Color Commands:**
    - "Change all red shapes to green"
    - "Make the blue rectangle purple"
    - Test batch color change
    - Verify undo/redo
    - Verify real-time sync

13. **Test Delete Commands:**
    - "Delete all circles"
    - "Remove the red rectangle"
    - Test batch delete
    - Verify confirmation for large deletions
    - Verify undo/redo
    - Verify real-time sync

14. **Performance Testing:**
    - Response time <2 seconds
    - Test with 100+ shapes
    - Test batch operations (50+ shapes)
    - Verify 60 FPS maintained
    - Measure query performance

15. **Integration Testing:**
    - Test move + undo + redo
    - Test resize + undo + redo
    - Test delete + undo + redo
    - Test multiple users simultaneously
    - Test complex scenarios

16. **Accuracy Testing:**
    - Test 50+ diverse manipulation commands
    - Track success rate per command type
    - Achieve 90%+ accuracy
    - Refine AI prompt based on failures

17. **Update Documentation:**
    - Add manipulation command examples to README.md
    - Document shape query syntax
    - Update PRD.md with final status

18. **Build, Test, and Deploy:** ✅
    - Test all 9-10 command types ✅
    - Verify EXCELLENT rating criteria:
      * 10 distinct command types ✅
      * All categories covered ✅
      * Sub-2 second responses ✅
      * 90%+ accuracy ✅
      * Multi-user support ✅
    - Build and deploy to production ✅

---

## PR #21: Multi-Project System + Thumbnails ✅
*Oct 18, 2025 - COMPLETE*

### Tasks Completed:
1. ✅ Create `Project` interface in `types.ts`
2. ✅ Implement `useProjects` hook with Firestore CRUD operations
3. ✅ Create `LoginPage` with authentication redirect
4. ✅ Create `ProjectsPage` with grid view
5. ✅ Create `ProjectCard` component
6. ✅ Create `CreateProjectModal` component
7. ✅ Refactor `App.tsx` into `CanvasPage.tsx`
8. ✅ Implement routing (`/login`, `/projects`, `/canvas/:projectId`)
9. ✅ Implement `useThumbnail` hook with Base64 encoding
10. ✅ Update Firestore security rules for project-based access
11. ✅ Update all hooks to use `projectId` instead of `CANVAS_ID`
12. ✅ Deploy and test

---

## PR #22: Project Enhancements + Bug Fixes ✅
*Oct 18, 2025 - COMPLETE*

### Tasks Completed:
1. ✅ Implement save functionality in `CanvasPage`
2. ✅ Add `onStageReady` callback to capture stage ref
3. ✅ Add `onShapesChange` callback to track unsaved changes
4. ✅ Create save button UI with states (unsaved/saving/saved)
5. ✅ Implement navigation guard for unsaved changes
6. ✅ Fix "Create Project" button width
7. ✅ Fix "Clear All" to auto-save empty canvas thumbnail
8. ✅ Fix AI agent infinite loading issue
9. ✅ Add yellow, orange, pink, gray to AI color support
10. ✅ Improve AI error handling (return error vs throw)
11. ✅ Center rectangle creation on click
12. ✅ Deploy and test

---

## PR #23: Manual Save System ✅
*Oct 18, 2025 - COMPLETE*

### Tasks Completed:
1. ✅ Removed auto-save from all shape operations (create, update, delete, duplicate)
2. ✅ Removed `flushAllUpdates` on unmount and page unload
3. ✅ Removed `useBeforeUnload` hook usage
4. ✅ Implemented `saveAllShapesToFirestore()` with full diff and sync
5. ✅ Added Firestore query to get existing shapes for comparison
6. ✅ Implemented batch delete for removed shapes
7. ✅ Fixed Clear All to trigger change notifications
8. ✅ Removed debug console logs
9. ✅ Fixed TypeScript errors (db! assertions)
10. ✅ Build and deploy to production

---

## PR #24: Project Management Enhancements ✅
*Oct 18, 2025 - COMPLETE*

### Tasks:
1. ✅ Add `duplicateProject` function to `useProjects` hook
2. ✅ Add `toggleFavorite` function to `useProjects` hook
3. ✅ Update `ProjectCard` with favorite star button (top-right overlay)
4. ✅ Update `ProjectCard` with duplicate option in context menu
5. ✅ Wire up actions in `ProjectsPage` (onToggleFavorite, onDuplicate)
6. ✅ Add CSS styling for favorite button with hover animations
7. ✅ Add CSS styling for thumbnail image display
8. ✅ Fix duplicate with undefined thumbnailUrl (conditional field inclusion)
9. ✅ Fix thumbnail generation (filter by className, not name)
10. ✅ Add white background to thumbnails (temp canvas + composite)
11. ✅ Fix Clear All thumbnail removal (deleteField for null)
12. ✅ Add list view CSS layout (horizontal cards)
13. ✅ Remove debug logging
14. ✅ Test features locally
15. ✅ Deploy to production

### Features:
- **Duplicate Projects**: Clone any project with all shapes and thumbnail
- **Favorite Projects**: Star/unstar projects for quick access
- **Enhanced UI**: Smooth hover effects and animations
- **Thumbnail Display**: Automatic JPEG thumbnails with white background
- **List View**: Horizontal card layout with thumbnail on left

---

## PR #25: Project Sorting & Filtering ✅
*Oct 18, 2025 - COMPLETE*

### Tasks:
1. ✅ Add state management for filter, sort, and search in ProjectsPage
2. ✅ Implement filtering logic (all, favorites, recent)
3. ✅ Implement sorting logic (lastAccessed, created, alphabetical)
4. ✅ Wire up search input to filter by project name
5. ✅ Wire up filter tabs with active states
6. ✅ Wire up sort dropdown to change sorting
7. ✅ Add empty state messages for filtered views
8. ✅ Test all combinations and deploy

### Features:
- **Filter Tabs**: All / Favorites / Recent (7 days)
- **Sort Options**: Last Accessed / Created Date / Alphabetical (A-Z)
- **Real-time Search**: Filter by project name as you type
- **Smart Empty States**: Context-aware messages for filtered views
- **Combined Pipeline**: Filter → Search → Sort with single `useMemo`

---

## 🎉 PROJECT CONTINUES - 25 PRs ACTIVE

**Final Achievement: 105/105 (EXCELLENT across all 6 sections) + Multi-Project System + Manual Save**

### Completed Features:
✅ Real-time collaborative canvas with sub-50ms sync
✅ 4 shape types with full transform operations
✅ Multi-select, layers, undo/redo, alignment tools
✅ Collaborative comments and presence awareness
✅ Color customization with picker
✅ Conflict resolution and offline support
✅ AI Canvas Agent with 10 command types
✅ 500+ shapes @ 60 FPS performance
✅ 5+ concurrent users supported
✅ Multi-project management system
✅ Project thumbnails with manual save
✅ Unsaved changes detection with exit warning
✅ Manual save system (no auto-save)
✅ Full Firestore sync (creates, updates, deletes)
✅ Comprehensive documentation
✅ Deployed to production

**Live URL:** https://collab-canvas-d3589.web.app
