import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import CanvasPage from './pages/CanvasPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContainer';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/projects" element={
                <ProtectedRoute>
                  {(user) => <ProjectsPage user={user} />}
                </ProtectedRoute>
              } />
              <Route path="/canvas/:projectId" element={
                <ProtectedRoute>
                  {(user) => <CanvasPage user={user} />}
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
