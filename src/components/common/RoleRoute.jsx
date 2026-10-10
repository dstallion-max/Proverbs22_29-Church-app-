import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, allow }) {
  const { profile, isBooting } = useAuth();

  if (isBooting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
        />
      </div>
    );
  }

  const role = profile?.role || 'member';

  if (!allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}