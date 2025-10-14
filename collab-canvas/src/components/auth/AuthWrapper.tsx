import { useState, useEffect } from 'react';
import { onAuthStateChange } from '../../lib/firebase';
import type { User } from '../../lib/types';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import './AuthForms.css';

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Auth state timeout - Firebase may not be initialized');
        setError('Firebase authentication not available. Check your configuration.');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    try {
      // Listen to auth state changes
      const unsubscribe = onAuthStateChange((firebaseUser) => {
        clearTimeout(timeoutId);
        if (firebaseUser) {
          // Convert Firebase user to our User type
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            color: generateUserColor(firebaseUser.uid), // Consistent color based on uid
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        setError(null);
      });

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (err) {
      console.error('Auth initialization error:', err);
      clearTimeout(timeoutId);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  // Generate consistent color based on user ID
  function generateUserColor(uid: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];
    // Use uid to consistently pick same color for same user
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>CollabCanvas</h1>
            <p>Real-time Collaborative Canvas</p>
          </div>
          <div className="auth-form">
            <div className="auth-error">{error}</div>
            <p style={{ marginTop: '1rem', color: '#718096' }}>
              Please check your Firebase configuration in <code>.env.local</code>
            </p>
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>CollabCanvas</h1>
            <p>Real-time Collaborative Canvas</p>
          </div>
          
          {showSignup ? (
            <SignupForm onToggleForm={() => setShowSignup(false)} />
          ) : (
            <LoginForm onToggleForm={() => setShowSignup(true)} />
          )}
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}

