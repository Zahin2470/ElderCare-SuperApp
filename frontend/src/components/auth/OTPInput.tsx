import { useRef, useState, KeyboardEvent, ChangeEvent } from 'react';
import { motion } from 'motion/react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  success?: boolean;
}

export default function OTPInput({ length = 6, value, onChange, error, success }: OTPInputProps) {
  const [focused, setFocused] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1);
    const newOTP = newValue.join('');
    
    onChange(newOTP);

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);
    
    // Focus last filled input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, type: 'spring' }}
        >
          <motion.input
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocused(index)}
            onBlur={() => setFocused(null)}
            animate={{
              scale: focused === index ? 1.05 : 1,
              borderColor: error 
                ? '#ef4444' 
                : success 
                ? '#10b981' 
                : focused === index 
                ? '#8b5cf6' 
                : '#e5e7eb',
            }}
            transition={{ duration: 0.2 }}
            className={`
              w-14 h-16 text-center text-xl rounded-2xl border-2 transition-all
              focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg
              ${error ? 'bg-red-50 focus:ring-red-500/30 shadow-red-200' : ''}
              ${success ? 'bg-green-50 focus:ring-green-500/30 shadow-green-200' : ''}
              ${!error && !success && focused === index ? 'bg-purple-50 focus:ring-purple-500/30 shadow-purple-200' : ''}
              ${!error && !success && focused !== index ? 'bg-white/50 backdrop-blur-sm shadow-gray-200' : ''}
            `}
          />
        </motion.div>
      ))}
    </div>
  );
}
