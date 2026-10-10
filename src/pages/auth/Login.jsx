import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toE164 } from '../../utils/phone';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const phoneE164 = toE164(phone);
    if (!phoneE164) {
      setError('Enter a valid Nigerian phone number (e.g. 08012345678)');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      phone: phoneE164,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="pt-10 pb-8 px-6 safe-top">
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--card)',
              border: '3px solid var(--gold)',
              boxShadow: '0 12px 32px rgba(37, 99, 235, 0.25)',
            }}
          >
            <img src="/icons/Rccg_logo.png" alt="RCCG Heghizbah Chapel" className="w-16 h-16" />
          </div>
          <h1 className="font-display text-2xl mt-4 text-center" style={{ color: 'var(--text)' }}>
            Heghizbah Chapel
          </h1>
          <p className="text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: 'var(--gold)' }}>
            RCCG · Welcome Home
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pb-8">
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
            Welcome Back
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to continue your journey
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Phone Number
              </label>
              <div className="relative mt-2">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
                  style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative mt-2">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl text-sm focus:outline-none"
                  style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
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
            </div>

            {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              {loading ? 'Signing in...' : (<><LogIn size={18} />Sign In</>)}
            </button>

            <div className="flex items-center justify-between pt-1">
              <Link to="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <Link
            to="/register"
            className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
            style={{
              background: 'var(--card-soft)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            Create an account
            <ArrowRight size={18} />
          </Link>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dim)' }}>
          RCCG Heghizbah Chapel · v1.0
        </p>
      </div>
    </div>
  );
}