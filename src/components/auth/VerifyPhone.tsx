import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, CheckCircle2, Smartphone, Shield, Clock } from 'lucide-react';
import OTPInput from './OTPInput';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

interface VerifyPhoneProps {
  phone: string;
  onVerified: () => void;
  onBack?: () => void;
}

export default function VerifyPhone({ phone, onVerified, onBack }: VerifyPhoneProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsVerifying(true);
    setError(false);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo: accept "123456" as valid
    if (otp === '123456') {
      setSuccess(true);
      toast.success('Phone verified successfully!');
      setTimeout(() => {
        onVerified();
      }, 1500);
    } else {
      setError(true);
      setAttempts(attempts + 1);
      
      if (attempts + 1 >= 3) {
        setIsLocked(true);
        toast.error('Too many attempts. Please try after 15 minutes.');
      } else {
        toast.error('Invalid code. Please try again.');
      }
    }

    setIsVerifying(false);
  };

  const handleResend = async () => {
    setCanResend(false);
    setTimeLeft(60);
    setOtp('');
    setError(false);
    setAttempts(0);
    toast.success('Verification code sent!');
  };

  useEffect(() => {
    if (otp.length === 6 && !isLocked) {
      handleVerify();
    }
  }, [otp]);

  const maskedPhone = phone.replace(/(\+880)(\d{2})(\d+)(\d{3})/, '$1$2*******$4');

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 hidden lg:block"
      >
        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-blue-500" />
        </div>
      </motion.div>
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 left-20 hidden lg:block"
      >
        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <Shield className="w-8 h-8 text-purple-500" />
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
            
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl shadow-lg flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur-xl"
                />
              </div>
            </motion.div>

            <h1 className="text-gray-900 mb-2 text-center">Verify your phone 📱</h1>
            <p className="text-gray-600 text-center">
              We sent a 6-digit code to <br />
              <span className="font-medium text-purple-600">{maskedPhone}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <OTPInput
                value={otp}
                onChange={setOtp}
                error={error}
                success={success}
              />
            </motion.div>

            {error && !isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-3 bg-red-50 rounded-xl border border-red-100"
              >
                <p className="text-sm text-destructive">
                  ❌ Invalid code — try again ({3 - attempts} attempts remaining)
                </p>
              </motion.div>
            )}

            {isLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl p-4"
              >
                <p className="text-sm text-destructive text-center flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Too many attempts — try after 15 minutes
                </p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex items-center justify-center gap-2 text-green-600 p-4 bg-green-50 rounded-xl border border-green-100"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>✨ Verified successfully!</span>
              </motion.div>
            )}

            {/* Resend */}
            <div className="text-center">
              {canResend && !isLocked ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResend}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  🔄 Resend code
                </Button>
              ) : !isLocked ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-xl">
                  <Clock className="w-4 h-4" />
                  Resend code in <span className="font-medium text-purple-600">{formatTime(timeLeft)}</span>
                </div>
              ) : null}
            </div>

            {/* Verify Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleVerify}
                disabled={otp.length !== 6 || isVerifying || isLocked || success}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Verifying...
                  </span>
                ) : 'Verify'}
              </Button>
            </motion.div>

            {/* Help Text */}
            <p className="text-xs text-center text-gray-500">
              Didn't receive the code? Check your phone number or try a different method.
            </p>
          </div>

          {/* Demo Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
          >
            <p className="text-xs text-blue-900 text-center">
              <strong>💡 Demo:</strong> Use code <span className="font-mono bg-blue-100 px-2 py-1 rounded">123456</span> to verify
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
