import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, KeyRound, Check } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Too short', color: 'var(--danger)', width: '25%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasNum, hasSymbol].filter(Boolean).length;
    if (score === 3 && password.length >= 8) return { label: 'Strong', color: 'var(--success)', width: '100%' };
    if (score >= 2) return { label: 'Good', color: 'var(--accent)', width: '75%' };
    return { label: 'Weak', color: 'var(--accent)', width: '45%' };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Clean up + sign out
    sessionStorage.removeItem('heghizbah-reset-phone');
    await supabase.auth.signOut();

    navigate('/forgot-password/success');
  };

  return (
    <div className="anim-fade-up min-h-screen max-w-md mx-auto" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/login')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-2">
        <HeroCard
          eyebrow="Step 3 of 3"
          title="Set a new password"
          subtitle="Choose something strong and memorable"
          right={<HeroIcon icon={KeyRound} />}
        />
      </div>

      <div className="px-5 mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              New Password
            </label>
            <div className="relative mt-2">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoFocus
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password && (
              <div className="mt-3">
                <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--card-soft)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: strength.width, background: strength.color }}
                  />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: strength.color }}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Confirm Password
            </label>
            <div className="relative mt-2">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {confirm && password === confirm && (
              <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--success)' }}>
                <Check size={12} />
                Passwords match
              </p>
            )}
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Saving...' : (<><KeyRound size={18} />Save New Password</>)}
          </button>
        </form>
      </div>
    </div>
  );
}