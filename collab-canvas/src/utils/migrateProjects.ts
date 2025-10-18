/**
 * Migration utility to add collaboratorIds field to existing projects
 * This should be run once to update all existing projects in the database
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function migrateProjectsToAddCollaboratorIds() {
  if (!db) {
    console.error('Firestore not initialized');
    return;
  }

  try {
    console.log('🔄 Starting project migration...');
    
    const projectsRef = collection(db, 'projects');
    const snapshot = await getDocs(projectsRef);
    
    let updated = 0;
    let skipped = 0;
    
    for (const projectDoc of snapshot.docs) {
      const data = projectDoc.data();
      
      // Check if collaboratorIds already exists
      if (data.collaboratorIds) {
        console.log(`⏭️  Skipping ${projectDoc.id} - already has collaboratorIds`);
        skipped++;
        continue;
      }
      
      // Extract user IDs from collaborators array
      const collaboratorIds = data.collaborators 
        ? data.collaborators.map((c: any) => c.userId)
        : [data.createdBy]; // Fallback to creator if no collaborators array
      
      // Update the document
      await updateDoc(doc(db, 'projects', projectDoc.id), {
        collaboratorIds,
      });
      
      console.log(`✅ Updated ${projectDoc.id} with collaboratorIds:`, collaboratorIds);
      updated++;
    }
    
    console.log(`✨ Migration complete! Updated: ${updated}, Skipped: ${skipped}`);
    return { updated, skipped };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Helper function to check if a project needs migration
export async function checkProjectNeedsMigration(projectId: string): Promise<boolean> {
  if (!db) return false;
  
  try {
    const projectDoc = await getDocs(collection(db, 'projects'));
    const project = projectDoc.docs.find(d => d.id === projectId);
    
    if (!project) return false;
    
    const data = project.data();
    return !data.collaboratorIds;
  } catch (error) {
    console.error('Error checking project:', error);
    return false;
  }
}

