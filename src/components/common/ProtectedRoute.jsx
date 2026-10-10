import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthed, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'var(--border)',
            borderTopColor: 'var(--primary)',
          }}
        />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthed, isBooting } = useAuth();

  if (isBooting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'var(--border)',
            borderTopColor: 'var(--primary)',
          }}
        />
      </div>
    );
  }

  if (isAuthed) return <Navigate to="/" replace />;

  return children;
}