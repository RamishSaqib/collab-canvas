import './App.css'
import { signOut } from './lib/firebase'
import AuthWrapper from './components/auth/AuthWrapper'
import Canvas from './components/canvas/Canvas'
import Toolbar from './components/canvas/Toolbar'
import type { User } from './lib/types'

function App() {
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
          <Toolbar user={user} onSignOut={handleSignOut} />
          <div className="canvas-wrapper">
            <Canvas user={user} />
          </div>
        </div>
      )}
    </AuthWrapper>
  )
}

export default App
