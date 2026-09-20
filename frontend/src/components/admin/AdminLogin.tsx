import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ApiError, errorMessage, post, Session } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { LogoImage } from '../brand/LogoImage';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Alert, AlertDescription } from '../ui/alert';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const { applySession } = useAuth();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState('');

  // Step 1: the server checks the password and, only if it is right, hands back a 5-minute challenge.
  // There is no session yet — the password alone never opens the admin console.
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await post<{ challenge: string }>('/admin/auth/login', { email: email.trim(), password });
      setChallenge(r.challenge);
      setStep('2fa');
    } catch (err) {
      setError(errorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: a one-time authenticator code turns the challenge into a real session.
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await post<Session>('/admin/auth/verify-2fa', { challenge, code: twoFACode });
      applySession(session); // App now renders the admin console
      onLoginSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'unauthorized') { setStep('credentials'); setPassword(''); } // challenge expired
      setError(errorMessage(err, 'Invalid 2FA code. Please try again.'));
      setTwoFACode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#4A90E2] via-[#3569B0] to-[#2B5690]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 backdrop-blur-lg bg-white/95 shadow-2xl border-0">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <LogoImage size="lg" animated />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="h-6 w-6 text-[#4A90E2]" />
              <h1 className="text-2xl font-semibold text-[#1F2D3D]">
                Admin Portal
              </h1>
            </div>
            <p className="text-sm text-gray-600">
              {step === 'credentials' 
                ? 'Secure access for authorized administrators'
                : 'Enter your 2FA code to continue'
              }
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Credentials Form */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eldercare.com"
                  required
                  className="w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4A90E2] to-[#3569B0] hover:from-[#3569B0] hover:to-[#2B5690]"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </Button>
            </form>
          )}

          {/* 2FA Form */}
          {step === '2fa' && (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4A90E2]/10 mb-4">
                  <Lock className="h-8 w-8 text-[#4A90E2]" />
                </div>
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <div>
                <Input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('credentials');
                    setTwoFACode('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#4A90E2] to-[#3569B0] hover:from-[#3569B0] hover:to-[#2B5690]"
                  disabled={loading || twoFACode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </form>
          )}

          {/* Local development only (seeded by `npm run db:seed`); never rendered in a production build. */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 font-medium mb-2">Dev admin account (seeded):</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>Email: <span className="font-mono">super@eldercare.com</span> · Password: <span className="font-mono">Admin@12345</span></p>
                <p>2FA: run <span className="font-mono">npm run totp -- super@eldercare.com</span> in <span className="font-mono">backend/</span></p>
              </div>
            </div>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-white/80 text-xs mt-6">
          Protected by enterprise-grade security • All actions are logged
        </p>
      </motion.div>
    </div>
  );
}
