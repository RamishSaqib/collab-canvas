# Troubleshooting Guide - Blank White Screen

## What You Should See

When you run `npm run dev`, the website should display:

### Expected Visual:
- **Purple gradient background** (from `#667eea` to `#764ba2`)
- **Centered glassmorphism card** with:
  - Header: "CollabCanvas MVP"
  - Subtitle: "Real-time Collaborative Canvas Application"
  - System Status section showing Firebase connection
  - MVP Features list with checkmarks
  - "Ready to start building!" message

## If You See a Blank White Screen

This means JavaScript is crashing before React can render. Here's how to fix it:

### Step 1: Check Browser Console

1. Open the dev server: `http://localhost:5175/` (or whatever port Vite shows)
2. Open browser DevTools (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Look for red error messages

### Common Issues:

#### Issue 1: Firebase Configuration Error
**Error message:** `Firebase: Error (auth/invalid-api-key)`

**Solution:**
```bash
# Make sure your .env.local has all required values
cat .env.local  # or type .env.local on Windows

# All of these must be filled in (not "your_project_id"):
VITE_FIREBASE_API_KEY=AIza...          # Real API key
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_FIREBASE_DATABASE_URL=https://project.firebaseio.com
```

#### Issue 2: CSS Not Loading
**Symptoms:** White screen, but no JavaScript errors

**Solution:**
```bash
# Restart the dev server
# Press Ctrl+C to stop
npm run dev
```

#### Issue 3: Port Already in Use
**Error message:** `Port 5173 is in use`

**Solution:** Vite will automatically try the next port (5174, 5175, etc.)
Make sure you're opening the URL shown in the terminal!

#### Issue 4: Firebase Not Initialized
**Console shows:** `Firebase config loaded: { hasApiKey: false, ... }`

**Solution:**
1. Make sure `.env.local` is in the `collab-canvas` directory (not the parent)
2. Variable names must start with `VITE_` (Vite requirement)
3. Restart dev server after creating/editing `.env.local`

### Step 2: Verify Firebase Setup

Run this in browser console (F12):
```javascript
// Check if environment variables are loaded
console.log(import.meta.env);
```

You should see your `VITE_FIREBASE_*` variables. If they're undefined:
- ✅ Check `.env.local` exists
- ✅ Check variable names start with `VITE_`
- ✅ Restart dev server

### Step 3: Check Firebase Console Logs

The app now logs Firebase initialization status. In browser console, you should see:

```
Firebase config loaded: {
  hasApiKey: true,
  hasAuthDomain: true,
  hasProjectId: true,
  projectId: "your-project-id"
}
✅ Firebase initialized successfully
```

If you see:
```
❌ Firebase initialization error: [error details]
```

The error details will tell you what's wrong (usually invalid API key or project ID).

### Step 4: Test Without Firebase

If you want to see the UI without Firebase working:

1. The app will now display even if Firebase fails (won't crash)
2. You'll see Firebase connection error in the status card
3. UI should still render with the gradient background

## Quick Fix Checklist

- [ ] Is dev server running? (`npm run dev`)
- [ ] Is browser console showing errors?
- [ ] Does `.env.local` exist in `collab-canvas/` directory?
- [ ] Are all environment variables filled in (not placeholder values)?
- [ ] Did you restart dev server after creating `.env.local`?
- [ ] Are you opening the correct URL (check terminal for port number)?
- [ ] Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- [ ] Try incognito/private mode

## Still Having Issues?

### Clear Cache and Restart

```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite  # or delete node_modules\.vite folder
npm run dev
```

### Verify Build Works

```bash
npm run build
# Should build successfully without errors
```

### Check TypeScript Compilation

```bash
npx tsc --noEmit
# Should show no errors
```

## Expected Console Output

When everything is working, you should see:

```
Firebase config loaded: {
  hasApiKey: true,
  hasAuthDomain: true, 
  hasProjectId: true,
  projectId: "collab-canvas-xxxxx"
}
✅ Firebase initialized successfully
```

And the page should display the beautiful purple gradient with the CollabCanvas card!

## Need More Help?

1. Check `FIREBASE-SETUP-REVIEW.md` for Firebase configuration details
2. Check `README.md` for setup instructions
3. Verify your Firebase project is created and services are enabled
4. Make sure you're using Node.js 20+ (check with `node --version`)

