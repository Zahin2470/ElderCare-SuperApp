import { useState } from 'react';
import { useAdminAuth, ROLE_PERMISSIONS, type AdminRole } from './AdminAuthContext';
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
  const { adminLogin, verify2FA } = useAdminAuth();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempAdminData, setTempAdminData] = useState<any>(null);

  // Mock admin accounts for demo
  const mockAdmins = {
    'super@eldercare.com': {
      id: 'admin_001',
      fullName: 'System Administrator',
      email: 'super@eldercare.com',
      role: 'super_admin' as AdminRole,
      permissions: ROLE_PERMISSIONS.super_admin,
      isVerified: true,
      has2FA: true,
      lastLogin: new Date().toISOString(),
    },
    'security@eldercare.com': {
      id: 'admin_002',
      fullName: 'Security Admin',
      email: 'security@eldercare.com',
      role: 'security_admin' as AdminRole,
      permissions: ROLE_PERMISSIONS.security_admin,
      isVerified: true,
      has2FA: true,
      lastLogin: new Date().toISOString(),
    },
    'ops@eldercare.com': {
      id: 'admin_003',
      fullName: 'Operations Manager',
      email: 'ops@eldercare.com',
      role: 'operations_admin' as AdminRole,
      permissions: ROLE_PERMISSIONS.operations_admin,
      isVerified: true,
      has2FA: true,
      lastLogin: new Date().toISOString(),
    },
    'clinical@eldercare.com': {
      id: 'admin_004',
      fullName: 'Dr. Clinical Admin',
      email: 'clinical@eldercare.com',
      role: 'clinical_admin' as AdminRole,
      permissions: ROLE_PERMISSIONS.clinical_admin,
      isVerified: true,
      has2FA: true,
      lastLogin: new Date().toISOString(),
    },
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const admin = mockAdmins[email as keyof typeof mockAdmins];
      
      if (admin && password === 'admin123') {
        setTempAdminData(admin);
        setStep('2fa');
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }, 500);
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isValid = await verify2FA(twoFACode);
    
    if (isValid) {
      adminLogin(tempAdminData);
      onLoginSuccess();
    } else {
      setError('Invalid 2FA code. Please try again.');
      setTwoFACode('');
    }
    setLoading(false);
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

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>super@eldercare.com (Super Admin)</p>
              <p>security@eldercare.com (Security Admin)</p>
              <p>ops@eldercare.com (Operations Admin)</p>
              <p>clinical@eldercare.com (Clinical Admin)</p>
              <p className="mt-2">Password: <span className="font-mono">admin123</span></p>
              <p>2FA Code: <span className="font-mono">Any 6 digits</span></p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-white/80 text-xs mt-6">
          Protected by enterprise-grade security • All actions are logged
        </p>
      </motion.div>
    </div>
  );
}
