import { Button } from '../ui/button';
import { Mail, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface PasswordResetSentProps {
  email?: string;
  phone?: string;
  onBackToLogin: () => void;
}

export default function PasswordResetSent({ email, phone, onBackToLogin }: PasswordResetSentProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Floating Sparkles */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 hidden lg:block"
      >
        <Sparkles className="w-8 h-8 text-yellow-500" />
      </motion.div>
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          rotate: [0, -180, -360]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 left-20 hidden lg:block"
      >
        <Sparkles className="w-6 h-6 text-green-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center relative z-10"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                <CheckCircle2 className="w-14 h-14 text-white" />
              </motion.div>
            </div>
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 bg-green-400 rounded-full"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="text-gray-900 mb-3">Check your {email ? 'email' : 'phone'} ✉️</h1>
          <p className="text-gray-600 mb-8">
            {email ? (
              <>
                We've sent password reset instructions to{' '}
                <span className="font-medium text-green-600">{email}</span>
              </>
            ) : (
              <>
                We've sent a verification code to{' '}
                <span className="font-medium text-green-600">{phone}</span>
              </>
            )}
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-6 mb-6 text-left"
        >
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900 mb-3">What's next?</h3>
              <ol className="text-sm text-gray-700 space-y-2.5">
                {[
                  `Check your ${email ? 'email inbox' : 'phone messages'}`,
                  'Click the reset link or enter the code',
                  'Create a new password',
                  'Sign in with your new password'
                ].map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-3"
        >
          <Button onClick={onBackToLogin} className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 transition-all">
            Back to login
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-sm text-gray-500">
            Didn't receive the {email ? 'email' : 'code'}?{' '}
            <button className="text-green-600 hover:text-green-700 hover:underline transition-colors">
              Resend
            </button>
          </p>
        </motion.div>

        {/* Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600">
            Still having trouble?{' '}
            <a href="#" className="text-green-600 hover:text-green-700 hover:underline transition-colors">
              Contact support
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
