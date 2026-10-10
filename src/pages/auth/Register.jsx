import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Lock, Eye, EyeOff, UserPlus, MessageCircle,
  ArrowLeft, CheckCircle2, KeyRound
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toE164 } from '../../utils/phone';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    whatsapp: '',
    email: '',
    password: '',
  });

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) return setError('Please agree to the terms');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');

    const phoneE164 = toE164(form.phone);
    if (!phoneE164) return setError('Enter a valid Nigerian phone number (e.g. 08012345678)');

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      phone: phoneE164,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username,
          whatsapp: toE164(form.whatsapp) || '',
          email: form.email,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStep('otp');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const phoneE164 = toE164(form.phone);

    const { error } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Sign out BEFORE navigating so the app doesn't flash Home
    await supabase.auth.signOut();

    navigate('/login', { replace: true });
    // Keep loading=true so button stays spinning until unmount
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center px-5 pt-6 pb-2 safe-top">
        <button
          onClick={() => step === 'otp' ? setStep('form') : navigate('/welcome')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="pt-4 pb-6 px-6">
        <div className="flex flex-col items-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              background: 'var(--card)',
              border: '3px solid var(--gold)',
              boxShadow: '0 12px 32px rgba(37, 99, 235, 0.22)',
            }}
          >
            <img src="/icons/Rccg_logo.png" alt="RCCG Heghizbah Chapel" className="w-14 h-14" />
          </div>
          <h1 className="font-display text-2xl mt-4 text-center" style={{ color: 'var(--text)' }}>
            {step === 'form' ? 'Join Heghizbah' : 'Verify Phone'}
          </h1>
          <p className="text-[10px] tracking-[0.3em] uppercase mt-1" style={{ color: 'var(--gold)' }}>
            {step === 'form' ? 'RCCG' : `Code sent to ${form.phone}`}
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
          {step === 'form' ? (
            <>
              <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>Create Account</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Begin your personal journey with God
              </p>

              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <Field label="Full Name" icon={User} value={form.fullName} onChange={(v) => update('fullName', v)} placeholder="e.g. David Adeyemi" />
                <Field label="Username" icon={User} value={form.username} onChange={(v) => update('username', v)} placeholder="e.g. davidadeyemi" />
                <Field label="Phone Number" icon={Phone} value={form.phone} onChange={(v) => update('phone', v)} placeholder="08012345678" type="tel" />
                <Field label="WhatsApp Number" icon={MessageCircle} value={form.whatsapp} onChange={(v) => update('whatsapp', v)} placeholder="Same as phone" type="tel" />
                <Field label="Email (optional)" icon={Mail} value={form.email} onChange={(v) => update('email', v)} placeholder="you@example.com" type="email" />

                <div>
                  <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <div className="relative mt-2">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Create a password"
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

                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: agreed ? 'var(--primary)' : 'var(--card-soft)',
                      border: `1px solid ${agreed ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >
                    {agreed && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    I agree to the Terms of Service and Privacy Policy of RCCG Heghizbah Chapel
                  </p>
                </button>

                {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !agreed}
                  className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}
                >
                  {loading ? 'Creating account...' : (<><UserPlus size={18} />Create Account</>)}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg" style={{ color: 'var(--text)' }}>Verify Phone</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Enter the 6-digit code sent to your phone
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-center tracking-[0.5em] focus:outline-none"
                    style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>

                {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
                  style={{ background: 'var(--primary)' }}
                >
                  {loading ? 'Verifying...' : (<><CheckCircle2 size={18} />Verify & Continue</>)}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="w-full py-3 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Change phone number
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-dim)' }}>
          Proverbs 16:3: Commit thy way unto the Lord and he will establish your plans
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="relative mt-2">
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
          style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
      </div>
    </div>
  );
}