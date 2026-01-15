import { Button } from '../ui/button';
import { CheckCircle2, ArrowRight, Sparkles, Heart, Shield, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileVerifiedProps {
  userName: string;
  onContinue: () => void;
}

const ConfettiPiece = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ y: -100, opacity: 0, rotate: 0 }}
    animate={{
      y: [0, 100, 200],
      opacity: [0, 1, 0],
      rotate: [0, 180, 360],
      x: Math.random() * 200 - 100,
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: 3,
    }}
    className="absolute w-2 h-2 rounded-full"
    style={{
      background: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      left: `${Math.random() * 100}%`,
    }}
  />
);

export default function ProfileVerified({ userName, onContinue }: ProfileVerifiedProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
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
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <ConfettiPiece key={i} delay={i * 0.1} />
        ))}
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-20 hidden lg:block"
      >
        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <Heart className="w-8 h-8 text-pink-500" />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -25, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 right-20 hidden lg:block"
      >
        <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center relative z-10"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle2 className="w-16 h-16 text-white" />
              </motion.div>
              
              {/* Sparkle effect */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" />
                <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-pink-400" />
              </motion.div>
            </div>
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-gray-900 mb-3">🎉 All set, {userName}!</h1>
          <p className="text-gray-600 mb-8">
            Your account has been verified successfully. Welcome to ElderCare! 🌟
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 mb-8 text-left space-y-4"
        >
          <h3 className="text-gray-900 text-center mb-5">✨ What you can do now:</h3>
          
          <div className="space-y-3">
            {[
              { icon: Heart, color: 'from-pink-500 to-rose-500', title: 'Book trusted caregivers', desc: 'Connect with verified professionals' },
              { icon: Activity, color: 'from-blue-500 to-cyan-500', title: 'Manage medications', desc: 'Track and get reminders' },
              { icon: Sparkles, color: 'from-yellow-500 to-orange-500', title: 'Order healthy meals', desc: 'Personalized nutrition plans' },
              { icon: Shield, color: 'from-purple-500 to-indigo-500', title: 'Access health records', desc: 'Digital medical history' },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-blue-50/50 hover:from-purple-50 hover:to-blue-50 rounded-2xl border border-purple-100/50 transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-0.5">{feature.title}</p>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button onClick={onContinue} className="w-full h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-2xl shadow-purple-500/40 transition-all">
            <span className="flex items-center justify-center gap-2">
              Continue to Dashboard
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
        </motion.div>

        {/* Fun Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 text-sm text-gray-500"
        >
          Let's make eldercare easier together! 💜
        </motion.p>
      </motion.div>
    </div>
  );
}
