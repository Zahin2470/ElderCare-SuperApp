import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthContext';
import Register from './Register';
import VerifyPhone from './VerifyPhone';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ProfileVerified from './ProfileVerified';
import { AdminLogin } from '../admin/AdminLogin';
import { SplashScreen } from '../brand/SplashScreen';
import { ApiError, post, Session } from '../../lib/api';

type Screen = 'splash' | 'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password' | 'profile-verified' | 'staff';

interface VerifyTarget { target: string; purpose: 'verify' | 'login'; devOtp?: string }

export default function AuthFlow() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [verify, setVerify] = useState<VerifyTarget | null>(null);
  const [pending, setPending] = useState<{ session: Session; name: string } | null>(null);
  const [registeredName, setRegisteredName] = useState('');
  const [resetTarget, setResetTarget] = useState<{ target: string; devOtp?: string } | null>(null);
  const { login, applySession } = useAuth();

  const startVerification = (v: VerifyTarget) => { setVerify(v); setScreen('verify'); };

  const handleRegister = async (data: { fullName: string; email?: string; phone?: string; password: string; role: 'senior' | 'family' }) => {
    const r = await post<{ verification: { target: string }; devOtp?: string }>('/auth/register', data);
    setRegisteredName(data.fullName);
    startVerification({ target: r.verification.target, purpose: 'verify', devOtp: r.devOtp });
  };

  const handleLogin = async (data: { identifier: string; password?: string; useOTP?: boolean }) => {
    try {
      if (data.useOTP) {
        const r = await post<{ devOtp?: string }>('/auth/request-otp', { target: data.identifier, purpose: 'login' });
        return startVerification({ target: data.identifier, purpose: 'login', devOtp: r.devOtp });
      }
      await login(data.identifier, data.password ?? ''); // on success the session flips the app to the dashboard
    } catch (e) {
      // Password was right but the phone/email was never verified: send them to finish verification.
      if (e instanceof ApiError && e.code === 'not_verified') {
        const target = (e.details as { target?: string } | undefined)?.target ?? data.identifier;
        const r = await post<{ devOtp?: string }>('/auth/request-otp', { target, purpose: 'verify' }).catch(() => ({ devOtp: undefined }));
        return startVerification({ target, purpose: 'verify', devOtp: r.devOtp });
      }
      throw e instanceof ApiError ? new Error(e.message) : e;
    }
  };

  const handleVerified = (session: Session) => {
    if (verify?.purpose === 'verify') {
      // Hold the session until the user taps Continue so the "You're verified" screen is actually seen.
      setPending({ session, name: registeredName || session.user.fullName });
      setScreen('profile-verified');
    } else {
      applySession(session);
    }
  };

  return (
    <>
      {screen === 'splash' && <SplashScreen onContinue={() => setScreen('login')} />}
      {screen === 'login' && (
        <Login
          onLogin={handleLogin}
          onRegister={() => setScreen('register')}
          onForgotPassword={() => setScreen('forgot-password')}
          onStaffLogin={() => setScreen('staff')}
        />
      )}
      {screen === 'register' && <Register onNext={handleRegister} onBack={() => setScreen('login')} />}
      {screen === 'verify' && verify && (
        <VerifyPhone phone={verify.target} purpose={verify.purpose} devOtp={verify.devOtp} onVerified={handleVerified} onBack={() => setScreen('login')} />
      )}
      {screen === 'forgot-password' && (
        <ForgotPassword
          onBack={() => setScreen('login')}
          onSent={(target, devOtp) => { setResetTarget({ target, devOtp }); setScreen('reset-password'); }}
        />
      )}
      {screen === 'reset-password' && resetTarget && (
        <ResetPassword target={resetTarget.target} devOtp={resetTarget.devOtp} onDone={() => setScreen('login')} onBack={() => setScreen('forgot-password')} />
      )}
      {screen === 'profile-verified' && pending && (
        <ProfileVerified userName={pending.name.split(' ')[0] || 'there'} onContinue={() => applySession(pending.session)} />
      )}
      {screen === 'staff' && (
        <div className="relative">
          <button onClick={() => setScreen('login')} className="absolute top-4 left-4 z-20 flex items-center gap-2 text-white/90 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Member sign-in
          </button>
          <AdminLogin onLoginSuccess={() => undefined} />
        </div>
      )}
    </>
  );
}
