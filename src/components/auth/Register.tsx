import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Sparkles, Shield, Heart } from 'lucide-react';
import PhoneInput from './PhoneInput';
import { motion } from 'motion/react';

interface RegisterProps {
  onNext: (data: {
    fullName: string;
    email?: string;
    phone?: string;
    password: string;
  }) => void;
  onBack?: () => void;
}

export default function Register({ onNext, onBack }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email && !phone) {
      newErrors.contact = 'Please provide either email or phone number';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (phone && phone.length < 10) {
      newErrors.phone = 'Invalid phone number';
    }

    // Password rules: at least 8 chars, one uppercase, one lowercase, one number, one special character
    const pwd = password || '';
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);

    const missing: string[] = [];
    if (!hasLength) missing.push('at least 8 characters');
    if (!hasUpper) missing.push('one uppercase letter (A-Z)');
    if (!hasNumber) missing.push('one number (0-9)');    
    if (!hasLower) missing.push('one lowercase letter (a-z)');
    if (!hasSpecial) missing.push('one special character (e.g. !@#$%)');

    if (missing.length) {
      // friendly sentence: "must contain X, Y and Z"
      const message = `Password must contain ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;
      newErrors.password = message;
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        fullName,
        email: email || undefined,
        phone: phone ? `+880${phone}` : undefined,
        password,
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-20 hidden lg:block"
      >
        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-yellow-500" />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 right-20 hidden lg:block"
      >
        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <Heart className="w-8 h-8 text-pink-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8"
        >
          {/* Header */}
          <div className="mb-8">
            {onBack && (
              <button
                onClick={onBack}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
            )}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg mb-3">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-gray-900 mb-2 text-center">Create account ✨</h1>
            <p className="text-gray-600 text-center">Join ElderCare to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="fullName">Full name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`pl-11 h-12 bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 ${
                    errors.fullName ? 'border-destructive' : ''
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="email">Email (optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={`pl-11 h-12 bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 ${
                    errors.email ? 'border-destructive' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PhoneInput
                value={phone}
                onChange={setPhone}
                label="Phone (optional)"
                error={errors.phone}
              />
            </motion.div>

            {errors.contact && (
              <p className="text-sm text-destructive">{errors.contact}</p>
            )}

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={`pl-11 pr-11 h-12 bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 ${
                    errors.password ? 'border-destructive' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500">Must be at least 8 characters and include uppercase, lowercase, and a special character.</p>
            </motion.div>

            {/* Terms Checkbox */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-start gap-3 p-4 bg-purple-50/50 rounded-xl"
            >
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className={errors.terms ? 'border-destructive mt-0.5' : 'mt-0.5'}
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
                By continuing you agree to our{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700 hover:underline">
                  Privacy Policy
                </a>
                .
              </label>
            </motion.div>
            {errors.terms && (
              <p className="text-sm text-destructive">{errors.terms}</p>
            )}

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 transition-all">
                Create account
              </Button>
            </motion.div>

            {/* Login Link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center text-sm text-gray-600 pt-2"
            >
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {/* Navigate to login */}}
                className="text-purple-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Sign in
              </button>
            </motion.p>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
