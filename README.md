# CollabCanvas MVP

A real-time collaborative canvas application built with React, TypeScript, and Firebase. Think Figma-like multiplayer experience with synchronized shapes, cursors, and presence awareness.

## 🌐 Live Demo

**Try it now:** [https://collab-canvas-d3589.web.app](https://collab-canvas-d3589.web.app)

Open the app in multiple browser windows to experience real-time collaboration!

## 🎯 MVP Features

- **Canvas Workspace**: Pan and zoom functionality with 60 FPS performance
- **Shape Support**: Create and manipulate shapes (rectangles)
- **Real-Time Collaboration**: 
  - Multiplayer cursors with name labels (<50ms sync)
  - Presence awareness (see who's online)
  - Object synchronization (<100ms sync)
- **User Authentication**: Email/password and Google OAuth
- **Firebase Integration**: Firestore for state, Realtime Database for cursors

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Canvas**: react-konva (Konva.js)
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Hosting)
- **Testing**: Vitest + Testing Library

## 📋 Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn
- Firebase account (for your own deployment)

## 🚀 Quick Start

Want to run this locally? Follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/RamishSaqib/collab-canvas.git
cd collab-canvas
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Note:** The `--legacy-peer-deps` flag is needed for React 19 compatibility.

### 3. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication** (Email/Password + Google OAuth)
   - **Firestore Database** (Start in test mode)
   - **Realtime Database** (Start in test mode)
   - **Hosting**

### 4. Configure environment variables

Copy the example file and fill in your Firebase credentials:

```bash
cp env.example .env.local
```

Then edit `.env.local` with your actual Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

Get these values from your Firebase project settings:
- Go to Project Settings > General > Your apps
- Select "Web app" and copy the config values

### 5. Initialize Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- Firestore
- Realtime Database  
- Hosting

Use existing files when prompted.

### 6. Deploy Firestore and Realtime Database rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only database
```

### 7. Run development server

```bash
npm run dev
```

The app will be running at [http://localhost:5173](http://localhost:5173) (or the next available port if 5173 is in use).

### 🎉 You're Ready!

Open the app in multiple browser windows or tabs to test real-time collaboration features.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build the app
npm run build

# Preview production build locally
npm run preview
```

## 🚢 Deployment

Deploy to Firebase Hosting:

```bash
# Build the production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

**Official Deployment:** [https://collab-canvas-d3589.web.app](https://collab-canvas-d3589.web.app)

## 📁 Project Structure

```
collab-canvas/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── auth/       # Authentication components
│   │   ├── canvas/     # Canvas and shapes
│   │   └── presence/   # User presence
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries
│   │   ├── firebase.ts # Firebase configuration
│   │   └── types.ts    # TypeScript types
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── tests/              # Test files
├── env.example         # Environment variables template
├── firebase.json       # Firebase configuration
├── firestore.rules     # Firestore security rules
├── database.rules.json # Realtime DB security rules
└── vite.config.ts      # Vite configuration
```

## 🏗️ Architecture

### Data Flow

1. **User Action** (create/move shape) → Local state update
2. **Broadcast** change to Firebase
3. **Firebase** broadcasts to all connected clients
4. **Clients** receive update → Render change

### Data Models

- **Firestore**: Canvas objects (persistent state)
- **Realtime Database**: Cursor positions, presence (ephemeral, high frequency)

### Conflict Resolution

Using "Last Write Wins" approach:
- Each update includes a timestamp
- Latest timestamp wins in conflicts
- Acceptable for MVP, documented for future improvement

## 🎯 Performance Targets

- ✅ 60 FPS during pan, zoom, object manipulation
- ✅ <100ms object sync latency between users
- ✅ <50ms cursor position sync
- ✅ 500+ objects on canvas without FPS drops
- ✅ 5+ concurrent users without degradation

## 🔧 Troubleshooting

### Firebase connection issues
- Verify `.env.local` contains correct Firebase config
- Check Firebase project has required services enabled
- Ensure security rules are deployed

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Verify Node.js version: `node --version`

## 📝 Known Limitations (MVP)

- Single shape type (rectangle)
- No shape rotation or resize
- No undo/redo
- No multi-select
- Basic conflict resolution (last write wins)

## 🚀 Future Enhancements

- Multiple shape types (circle, text, line)
- Shape transformation (rotate, resize)
- Advanced selection (multi-select, lasso)
- Undo/redo functionality
- AI agent with function calling
- Comments and chat
- Export functionality

## 📄 License

MIT

## 🤝 Contributing

This is an MVP project. Contributions welcome after initial checkpoint!

---

Built with ❤️ for real-time collaboration
