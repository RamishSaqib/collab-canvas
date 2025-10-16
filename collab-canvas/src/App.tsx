import { useState, useEffect } from 'react'
import './App.css'
import { signOut } from './lib/firebase'
import AuthWrapper from './components/auth/AuthWrapper'
import Canvas, { type CanvasMode } from './components/canvas/Canvas'
import Toolbar from './components/canvas/Toolbar'
import Sidebar from './components/canvas/Sidebar'
import ConnectionStatusBanner from './components/ConnectionStatusBanner'
import type { User } from './lib/types'

function App() {
  const [mode, setMode] = useState<CanvasMode>('select')
  const [selectedColor, setSelectedColor] = useState('#667eea')
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker)
  }

  const handleGenerateTestShapes = (count: number) => {
    // Call the function exposed by Canvas
    if ((window as any).__generateTestShapes) {
      (window as any).__generateTestShapes(count);
    }
  }

  const handleClearAllShapes = () => {
    // Call the function exposed by Canvas
    if ((window as any).__clearAllShapes) {
      (window as any).__clearAllShapes();
    }
  }

  // Keyboard shortcut for color picker
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if user is not typing in an input field
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // 'P' key toggles color picker
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        toggleColorPicker()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showColorPicker])

  return (
    <AuthWrapper>
      {(user: User) => (
        <div className="app-container">
          <Toolbar 
            user={user} 
            onSignOut={handleSignOut}
            mode={mode}
            onModeChange={setMode}
            selectedColor={selectedColor}
            showColorPicker={showColorPicker}
            onToggleColorPicker={toggleColorPicker}
            onGenerateTestShapes={handleGenerateTestShapes}
            onClearAllShapes={handleClearAllShapes}
            shapeCount={0}
          />
          <ConnectionStatusBanner />
          <div className="main-content">
            <div className="canvas-wrapper">
              <Canvas 
                user={user}
                mode={mode}
                onModeChange={setMode}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                showColorPicker={showColorPicker}
                onCloseColorPicker={() => setShowColorPicker(false)}
                onGenerateTestShapes={handleGenerateTestShapes}
                onClearAllShapes={handleClearAllShapes}
              />
            </div>
            <Sidebar currentUser={user} />
          </div>
        </div>
      )}
    </AuthWrapper>
  )
}

export default App
