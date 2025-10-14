import { useState, useEffect } from 'react'
import './App.css'
import app, { signOut } from './lib/firebase'
import AuthWrapper from './components/auth/AuthWrapper'
import type { User } from './lib/types'

function App() {
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Test Firebase connection
    try {
      if (app) {
        setFirebaseStatus('✅ Firebase Connected')
      } else {
        setFirebaseStatus('❌ Firebase Not Connected')
      }
    } catch (error) {
      setFirebaseStatus(`❌ Firebase Error: ${error}`)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthWrapper>
      {(user: User) => (
        <div className="App">
          <header className="App-header">
            <div className="user-info">
              <div className="user-details">
                <span className="user-avatar" style={{ backgroundColor: user.color }}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="user-name">{user.name}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut} className="btn-signout">
                Sign Out
              </button>
            </div>

            <h1>CollabCanvas MVP</h1>
            <p>Real-time Collaborative Canvas Application</p>
            
            <div className="status-card">
              <h2>System Status</h2>
              <p className="status">{firebaseStatus}</p>
              <p className="status">✅ Authenticated as {user.name}</p>
            </div>

            <div className="info-card">
              <h3>🎯 MVP Features</h3>
              <ul>
                <li>✅ User authentication (Email/Password & Google OAuth)</li>
                <li>Pan and zoom canvas</li>
                <li>Create and move shapes</li>
                <li>Real-time multiplayer cursors</li>
                <li>Presence awareness</li>
                <li>Object synchronization</li>
              </ul>
            </div>

            <p className="ready-message">
              🚀 Ready to start building!
            </p>
          </header>
        </div>
      )}
    </AuthWrapper>
  )
}

export default App
