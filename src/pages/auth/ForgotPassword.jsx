import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Send, CheckCircle2 } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { toE164 } from '../../utils/phone';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const phoneE164 = toE164(phone);
    if (!phoneE164) {
      setError('Enter a valid Nigerian phone number (e.g. 08012345678)');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneE164,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Save phone so the verify page knows which number to check
    sessionStorage.setItem('heghizbah-reset-phone', phoneE164);
    navigate('/forgot-password/verify');
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
          eyebrow="Account Recovery"
          title="Forgot Password?"
          subtitle="We'll send a 6-digit code to your phone"
          right={<HeroIcon icon={Phone} />}
        />
      </div>

      <div className="px-5 mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? 'Sending code...' : (<><Send size={18} />Send Code</>)}
          </button>
        </form>

        <div
          className="mt-6 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'var(--card-soft)', border: '1px solid var(--border)' }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            The code will be sent to your registered phone number. It expires in 5 minutes.
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
          Remember it?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}