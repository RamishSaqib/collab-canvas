import { useState, useEffect } from 'react'
import './App.css'
import app from './lib/firebase'

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>CollabCanvas MVP</h1>
        <p>Real-time Collaborative Canvas Application</p>
        
        <div className="status-card">
          <h2>System Status</h2>
          <p className="status">{firebaseStatus}</p>
        </div>

        <div className="info-card">
          <h3>🎯 MVP Features</h3>
          <ul>
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
  )
}

export default App
