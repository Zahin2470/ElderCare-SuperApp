import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { errorMessage, post } from '../../lib/api';

interface Props {
  /** Email or +880 phone the code was sent to. */
  target: string;
  devOtp?: string;
  onDone: () => void;
  onBack: () => void;
}

const RULES: [string, (p: string) => boolean][] = [
  ['8+ characters', (p) => p.length >= 8],
  ['an uppercase letter', (p) => /[A-Z]/.test(p)],
  ['a lowercase letter', (p) => /[a-z]/.test(p)],
  ['a number', (p) => /[0-9]/.test(p)],
  ['a special character', (p) => /[^A-Za-z0-9]/.test(p)],
];

/** Second half of "forgot password": enter the code we sent, choose a new password. */
export default function ResetPassword({ target, devOtp, onDone, onBack }: Props) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const missing = RULES.filter(([, ok]) => !ok(password)).map(([label]) => label);
  const masked = target.includes('@') ? target.replace(/^(.{2}).*(@.*)$/, '$1***$2') : target.replace(/(\+880)(\d{2})(\d+)(\d{2})$/, '$1$2*****$4');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code we sent you.');
    if (missing.length) return setError(`Your new password still needs: ${missing.join(', ')}.`);
    setBusy(true);
    try {
      await post('/auth/reset-password', { identifier: target, code, newPassword: password });
      toast.success('Password updated. Please sign in.');
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-purple-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4 mx-auto"><KeyRound className="w-7 h-7 text-purple-600" /></div>
          <h1 className="text-center text-gray-900 mb-2">Set a new password</h1>
          <p className="text-center text-gray-600 mb-6">
            If an account exists for <span className="font-medium text-purple-600">{masked}</span>, we sent it a 6-digit code.
          </p>
          {import.meta.env.DEV && devOtp && (
            <p className="mb-4 text-xs text-center text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-2">Dev mode — your code is <span className="font-mono font-semibold">{devOtp}</span></p>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="code">6-digit code</Label>
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="h-12 tracking-widest text-center text-lg" />
            </div>
            <div>
              <Label htmlFor="newpw">New password</Label>
              <div className="relative">
                <Input id="newpw" type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-11" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {RULES.map(([label, ok]) => (
                  <li key={label} className={ok(password) ? 'text-green-600' : 'text-gray-500'}>{ok(password) ? '✓' : '○'} {label}</li>
                ))}
              </ul>
            </div>
            {error && <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
            <Button type="submit" disabled={busy} className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white">{busy ? 'Updating…' : 'Update password'}</Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
