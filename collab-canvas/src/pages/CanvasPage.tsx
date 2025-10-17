import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signOut } from '../lib/firebase';
import Canvas, { type CanvasMode } from '../components/canvas/Canvas';
import Toolbar from '../components/canvas/Toolbar';
import Sidebar from '../components/canvas/Sidebar';
import ConnectionStatusBanner from '../components/ConnectionStatusBanner';
import type { User } from '../lib/types';
import '../App.css';

interface CanvasPageProps {
  user: User;
}

export default function CanvasPage({ user }: CanvasPageProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<CanvasMode>('select');
  const [selectedColor, setSelectedColor] = useState('#667eea');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Redirect if no projectId
  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
    }
  }, [projectId, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleBackToProjects = () => {
    // TODO: Check for unsaved changes before navigating
    navigate('/projects');
  };

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
  };

  const handleGenerateTestShapes = (count: number) => {
    if ((window as any).__generateTestShapes) {
      (window as any).__generateTestShapes(count);
    }
  };

  const handleClearAllShapes = () => {
    if ((window as any).__clearAllShapes) {
      (window as any).__clearAllShapes();
    }
  };

  const handleAICommand = async (command: string): Promise<{ success: boolean; message: string }> => {
    if ((window as any).__processAICommand) {
      return await (window as any).__processAICommand(command);
    }
    return { success: false, message: 'AI agent not initialized' };
  };

  const getAIStatus = () => {
    return {
      isProcessing: (window as any).__isAIProcessing || false,
      error: (window as any).__aiError || null,
    };
  };

  // Keyboard shortcut for color picker
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        toggleColorPicker();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showColorPicker]);

  if (!projectId) {
    return null;
  }

  return (
    <div className="app-container">
      <Toolbar 
        user={user} 
        onSignOut={handleSignOut}
        onBackToProjects={handleBackToProjects}
        mode={mode}
        onModeChange={setMode}
        selectedColor={selectedColor}
        showColorPicker={showColorPicker}
        onToggleColorPicker={toggleColorPicker}
        onGenerateTestShapes={handleGenerateTestShapes}
        onClearAllShapes={handleClearAllShapes}
        shapeCount={0}
        onAICommand={handleAICommand}
        isAIProcessing={getAIStatus().isProcessing}
        aiError={getAIStatus().error}
      />
      <ConnectionStatusBanner />
      <div className="main-content">
        <div className="canvas-wrapper">
          <Canvas 
            user={user}
            projectId={projectId}
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
        <Sidebar currentUser={user} projectId={projectId} />
      </div>
    </div>
  );
}

