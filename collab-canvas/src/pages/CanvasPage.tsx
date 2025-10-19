import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { signOut, db } from '../lib/firebase';
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
  const { projects, updateProject } = useProjects({ userId: user.id, userEmail: user.email });
  
  // Get current project
  const currentProject = projects.find(p => p.id === projectId);

  // Redirect if no projectId
  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
    }
  }, [projectId, navigate]);

  // Warn user before closing tab/refreshing if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Add diagnostic utilities for debugging sync
  useEffect(() => {
    (window as any).__testRTDBSync = () => {
      console.log('🧪 Testing Hybrid Save System...');
      console.log('  Project ID:', projectId);
      console.log('  User ID:', user.id);
      console.log('  User Email:', user.email);
      console.log('  ');
      console.log('🔍 HYBRID SAVE SYSTEM:');
      console.log('  ');
      console.log('📝 CREATE (auto-saved):');
      console.log('  1. User A: Create a shape');
      console.log('  2. User B: Sees it immediately via Firestore');
      console.log('  ');
      console.log('🗑️ DELETE (auto-saved):');
      console.log('  1. User A: Delete a shape');
      console.log('  2. User B: Sees it disappear immediately');
      console.log('  ');
      console.log('✏️ EDIT (manual save):');
      console.log('  1. User A: Drag/resize a shape');
      console.log('  2. User A: Click "Save Project"');
      console.log('  3. User B: Sees permanent update');
    };
    
    (window as any).__debugSync = () => {
      console.log('📊 Current sync status:');
      console.log('  Project ID:', projectId);
      console.log('  User:', user.email || user.id);
      console.log('  ');
      console.log('📋 Expected console messages:');
      console.log('  - Creating: "🆕 addShapeToState called" → "💾 Auto-saving shape" → "✅ Shape saved to Firestore"');
      console.log('  - Deleting: "🗑️ removeShapeFromState called" → "🗑️ Auto-deleting shape" → "✅ Shape deleted from Firestore"');
      console.log('  - Received: "🔥 Firestore update received" (instant for creates/deletes)');
      console.log('  ');
      console.log('💾 HYBRID: Creates/deletes auto-save, edits require manual save');
    };
    
    console.log('🔧 Diagnostic utilities loaded:');
    console.log('  - window.__testRTDBSync() - Testing instructions');
    console.log('  - window.__debugSync() - Show expected console messages');
    
    return () => {
      delete (window as any).__testRTDBSync;
      delete (window as any).__debugSync;
    };
  }, [projectId, user.id, user.email]);

  // Determine edit permissions (read-only for public viewers)
  const [canEdit, setCanEdit] = useState<boolean>(true);
  useEffect(() => {
    const checkAccess = async () => {
      if (!projectId || !db) return;
      try {
        const projectRef = doc(db, 'projects', projectId);
        const snap = await getDoc(projectRef);
        if (!snap.exists()) {
          setCanEdit(false);
          return;
        }
        const data: any = snap.data();
        const isOwner = data.createdBy === user.id;
        const collabRole = (data.collaborators || []).find((c: any) => c.userId === user.id)?.role;
        const isEditor = collabRole === 'editor' || isOwner;
        // Public viewers not listed as editor are view-only
        setCanEdit(Boolean(isEditor));

        // If public and viewer not listed in collaborators, add as viewer in UI (owner will still manage elevation)
        if (data.isPublic && !isOwner && !collabRole) {
          // Add lightweight viewer to collaborators for display purposes
          // Owner can later promote to editor; writes are allowed by rules for collaborator fields only
          try {
            await (await import('firebase/firestore')).updateDoc(projectRef, {
              collaborators: [...(data.collaborators || []), { userId: user.id, role: 'viewer', addedAt: Date.now(), email: user.email }],
              collaboratorIds: Array.from(new Set([...(data.collaboratorIds || []), user.id])),
              lastModifiedAt: Date.now(),
            });
          } catch (e) {
            // ignore if rules block due to race
          }
        }
      } catch {
        setCanEdit(false);
      }
    };
    checkAccess();
  }, [projectId, user.id]);

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
      const userWantsToSave = window.confirm(
        '⚠️ You have unsaved changes.\n\n' +
        'Click OK to SAVE and leave.\n' +
        'Click Cancel to DISCARD changes and leave.'
      );
      
      if (userWantsToSave) {
        // Save and then navigate
        handleSave().then(() => {
          navigate('/projects');
        });
      } else {
        // User chose to discard changes
        console.log('🔄 Discarding unsaved edits (creates/deletes are already saved)');
        // Navigate away - React state cleanup automatically discards unsaved edits
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
      const updates: any = {
        lastAccessedAt: Date.now(),
      };
      
      // Set thumbnailUrl to null to explicitly clear it when there are no shapes
      // (updateProject will convert null to deleteField())
      if (thumbnailUrl !== null) {
        updates.thumbnailUrl = thumbnailUrl;
      } else {
        updates.thumbnailUrl = null;
      }
      
      await updateProject(projectId, updates);

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
        projectName={currentProject?.name || 'Untitled Project'}
        readOnly={!canEdit}
      />
      <ConnectionStatusBanner />
      <div className="main-content">
        <div className="canvas-wrapper">
          <Canvas 
            user={user}
            projectId={projectId}
            readOnly={!canEdit}
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

