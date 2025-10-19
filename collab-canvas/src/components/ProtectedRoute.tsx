import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from '../lib/types';

interface ProtectedRouteProps {
  children?: (user: User) => React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Generate consistent color for user
        const colors = [
          '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
          '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
          '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
          '#ec4899', '#f43f5e'
        ];
        const colorIndex = firebaseUser.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        
        // Detect system theme preference
        const theme = (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) 
          ? 'dark' 
          : 'light';
        
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
          email: firebaseUser.email || '',
          color: colors[colorIndex],
          theme,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#667eea',
          fontWeight: 600
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If children is a render prop, call it with user
  if (children) {
    return <>{children(user)}</>;
  }

  // Otherwise, render Outlet (for nested routes)
  return <Outlet context={{ user }} />;
}

