import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const inputs = useRef([]);

  const phone = sessionStorage.getItem('heghizbah-reset-phone') || '';

  useEffect(() => {
    if (!phone) navigate('/forgot-password', { replace: true });
  }, [phone, navigate]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const handleChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[idx] = value.slice(-1);
    setDigits(next);
    if (value && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setDigits(pasted.split(''));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    const code = digits.join('');

    if (code.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Session created — user is now temporarily signed in.
    // Reset password page will call updateUser.
    navigate('/forgot-password/reset');
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setError('');

    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setError(error.message);
      return;
    }
    setSecondsLeft(30);
    setDigits(['', '', '', '', '', '']);
    alert('New code sent');
  };

  return (
    <div className="anim-fade-up min-h-screen max-w-md mx-auto" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/forgot-password')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-2">
        <HeroCard
          eyebrow="Verification"
          title="Enter the 6-digit code"
          subtitle={`Sent to ${phone || 'your phone'}`}
          right={<HeroIcon icon={ShieldCheck} />}
        />
      </div>

      <div className="px-5 mt-8">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, idx) => (
            <input
              key={idx}
              ref={(el) => (inputs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              value={d}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              maxLength={1}
              autoFocus={idx === 0}
              className="w-12 h-14 rounded-xl text-center font-display text-xl focus:outline-none transition"
              style={{
                background: 'var(--card)',
                color: 'var(--text)',
                border: d ? '2px solid var(--primary)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-center mt-4" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <button
          onClick={handleResend}
          disabled={secondsLeft > 0}
          className="w-full mt-3 py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-40"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          <RefreshCw size={16} />
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  );
}