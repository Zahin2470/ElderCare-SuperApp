import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

const countries = [
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
];

export default function PhoneInput({ value, onChange, error, label = 'Phone number', placeholder = '1XXXXXXXXX' }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [open, setOpen] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value.replace(/\D/g, '');
    onChange(phoneNumber);
  };

  const isValid = value.length === 10 || value.length === 11;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-24 justify-between px-3"
              type="button"
            >
              <span className="flex items-center gap-1">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="space-y-1">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setSelectedCountry(country);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span className="text-sm">{country.name}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1 relative">
          <Input
            type="tel"
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            className={`pr-10 ${error ? 'border-destructive' : isValid && value ? 'border-green-600' : ''}`}
          />
          {isValid && value && !error && (
            <Check className="w-5 h-5 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && value && (
        <p className="text-xs text-muted-foreground">
          Full number: {selectedCountry.dialCode}{value}
        </p>
      )}
    </div>
  );
}
