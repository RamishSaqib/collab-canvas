import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import '../components/auth/AuthForms.css';
import './LoginPage.css';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to projects
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/projects', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        {isLogin ? <LoginForm onToggleForm={() => setIsLogin(false)} /> : <SignupForm onToggleForm={() => setIsLogin(true)} />}
      </div>
    </div>
  );
}

