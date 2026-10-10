import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <div
      className="anim-fade-up min-h-screen max-w-md mx-auto flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: 'var(--success-soft)',
          border: '2px solid var(--success)',
        }}
      >
        <CheckCircle2 size={48} style={{ color: 'var(--success)' }} />
      </div>

      <h1 className="font-display text-2xl mt-6 text-center" style={{ color: 'var(--text)' }}>
        Password Reset
      </h1>
      <p className="text-sm mt-2 text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
        Your password has been updated successfully. Sign in with your new password to continue.
      </p>

      <button
        onClick={() => navigate('/login', { replace: true })}
        className="w-full mt-10 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition"
        style={{ background: 'var(--primary)' }}
      >
        Sign In Now
      </button>

      <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dim)' }}>
        RCCG Heghizbah Chapel · A Place of Grace
      </p>
    </div>
  );
}