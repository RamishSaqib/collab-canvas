# CollabCanvas

Real-time collaborative canvas application with multiplayer synchronization. Create shapes, collaborate with others, and use AI to build complex layouts.

## 🌐 Live Demo

**Production:** [https://collab-canvas-d3589.web.app](https://collab-canvas-d3589.web.app)

Open in multiple browser windows to see real-time collaboration in action!

## ✨ Features

- Real-time multiplayer canvas with <50ms cursor sync
- Multiple shape types (rectangles, circles, triangles, text)
- AI-powered canvas agent for natural language commands
- Collaborative features (comments, presence awareness, undo/redo)
- Advanced tools (alignment, layer management, multi-select, transforms)
- Color customization with HSL color picker
- Keyboard shortcuts for efficient workflow

## 🚀 Quick Setup

### Prerequisites
- Node.js 20.19+ or 22.12+
- Firebase account
- OpenAI API key (for AI features)

### 1. Clone and Install
```bash
git clone https://github.com/RamishSaqib/collab-canvas.git
cd collab-canvas
npm install --legacy-peer-deps
```

### 2. Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password + Google OAuth)
3. Enable Firestore Database (test mode)
4. Enable Realtime Database (test mode)

### 3. Environment Configuration
Copy `env.example` to `.env.local` and fill in your credentials:
```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 4. Deploy Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules,database
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

## 🎮 Keyboard Shortcuts

### Tools
- `V` - Select tool
- `R` - Rectangle
- `C` - Circle  
- `T` - Triangle
- `A` - Text
- `H` - Hand tool (pan canvas)
- `P` - Color picker

### Canvas
- `Delete/Backspace` - Delete selected shapes
- `Ctrl+Z` - Undo
- `Ctrl+Shift+Z` - Redo
- `Ctrl+]` - Bring forward
- `Ctrl+[` - Send backward
- `?` - Show all shortcuts

### AI Commands
- "Create a red circle"
- "Create a navbar with 5 items"
- "Create a login form"
- "Move the blue rectangle to the center"
- "Resize all circles to be twice as big"
- "Delete all red shapes"

## 🏗️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Canvas:** react-konva
- **Backend:** Firebase (Auth, Firestore, Realtime DB, Hosting)
- **AI:** OpenAI GPT-4 Turbo

## 📦 Building for Production

```bash
npm run build
firebase deploy --only hosting
```

## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome! See `tasks.md` for current development roadmap.
