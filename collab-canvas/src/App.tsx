import { useState } from 'react'
import './App.css'
import { signOut } from './lib/firebase'
import AuthWrapper from './components/auth/AuthWrapper'
import Canvas, { type CanvasMode } from './components/canvas/Canvas'
import Toolbar from './components/canvas/Toolbar'
import type { User } from './lib/types'

function App() {
  const [mode, setMode] = useState<CanvasMode>('select')

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
        <div className="app-container">
          <Toolbar 
            user={user} 
            onSignOut={handleSignOut}
            mode={mode}
            onModeChange={setMode}
          />
          <div className="canvas-wrapper">
            <Canvas 
              user={user}
              mode={mode}
              onModeChange={setMode}
            />
          </div>
        </div>
      )}
    </AuthWrapper>
  )
}

export default App
