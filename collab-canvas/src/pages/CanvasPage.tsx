import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signOut } from '../lib/firebase';
import Canvas, { type CanvasMode } from '../components/canvas/Canvas';
import Toolbar from '../components/canvas/Toolbar';
import Sidebar from '../components/canvas/Sidebar';
import ConnectionStatusBanner from '../components/ConnectionStatusBanner';
import { useThumbnail } from '../hooks/useThumbnail';
import { useProjects } from '../hooks/useProjects';
import type { User } from '../lib/types';
import type Konva from 'konva';
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
  
  // Save functionality
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const stageRef = useRef<Konva.Stage | null>(null);
  
  const { generateThumbnail } = useThumbnail();
  const { updateProject } = useProjects({ userId: user.id });

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
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to save before leaving?')) {
        // Save and then navigate
        handleSave().then(() => {
          navigate('/projects');
        });
      } else {
        // Navigate without saving
        navigate('/projects');
      }
    } else {
      navigate('/projects');
    }
  };

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
  };

  // Handle save project
  const handleSave = useCallback(async () => {
    if (!projectId || !stageRef.current || isSaving) return;

    setIsSaving(true);
    try {
      // First, persist all shapes to Firestore
      if ((window as any).__saveAllShapesToFirestore) {
        await (window as any).__saveAllShapesToFirestore();
        console.log('✅ Shapes persisted to Firestore');
      }

      // Then generate thumbnail
      const thumbnailUrl = await generateThumbnail(stageRef.current);
      
      // Update project with thumbnail and lastAccessedAt
      await updateProject(projectId, {
        thumbnailUrl: thumbnailUrl || undefined,
        lastAccessedAt: Date.now(),
      });

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      console.log('✅ Project saved successfully');
    } catch (error) {
      console.error('❌ Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, generateThumbnail, updateProject, isSaving]);

  // Track when shapes change
  const handleShapesChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

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

  const handleAICommand = useCallback(async (command: string): Promise<{ success: boolean; message: string }> => {
    if (!(window as any).__processAICommand) {
      return { success: false, message: 'AI agent not initialized' };
    }
    
    setIsAIProcessing(true);
    try {
      const result = await (window as any).__processAICommand(command);
      return result;
    } finally {
      setIsAIProcessing(false);
    }
  }, []);

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
        isAIProcessing={isAIProcessing}
        aiError={(window as any).__aiError || null}
        onSave={handleSave}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
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
            onStageReady={(stage: Konva.Stage) => { stageRef.current = stage; }}
            onShapesChange={handleShapesChange}
          />
        </div>
        <Sidebar currentUser={user} projectId={projectId} />
      </div>
    </div>
  );
}

