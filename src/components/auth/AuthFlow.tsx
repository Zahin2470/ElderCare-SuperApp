import { useState } from 'react';
import { useAuth } from './AuthContext';
import Register from './Register';
import VerifyPhone from './VerifyPhone';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import PasswordResetSent from './PasswordResetSent';
import ProfileVerified from './ProfileVerified';
import { SplashScreen } from '../brand/SplashScreen';

type AuthScreen = 
  | 'splash'
  | 'login' 
  | 'register' 
  | 'verify-phone' 
  | 'verify-email-sent'
  | 'forgot-password'
  | 'reset-sent'
  | 'profile-verified';

export default function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>('splash');
  const [tempUserData, setTempUserData] = useState<any>(null);
  const { login } = useAuth();

  const handleRegister = (data: any) => {
    setTempUserData(data);
    
    // If phone provided, go to verification
    if (data.phone) {
      setScreen('verify-phone');
    } else if (data.email) {
      // If only email, show email verification sent
      setScreen('verify-email-sent');
    } else {
      // Should not happen due to validation, but handle anyway
      setScreen('profile-verified');
    }
  };

  const handlePhoneVerified = () => {
    setScreen('profile-verified');
  };

  const handleLogin = (data: { identifier: string; password?: string; useOTP?: boolean }) => {
    if (data.useOTP) {
      // Store identifier and go to OTP verification
      setTempUserData({ phone: data.identifier });
      setScreen('verify-phone');
    } else {
      // Demo login: accept specific credentials
      if (
        (data.identifier === 'demo@eldercare.com' || data.identifier === '+8801712345678') &&
        data.password === 'password123'
      ) {
        // Mock user data
        login({
          id: '1',
          fullName: 'Md. Mosarraf Hossain',
          email: 'demo@eldercare.com',
          phone: '+8801712345678',
          role: 'senior',
          isVerified: true,
        });
      } else {
        alert('Invalid credentials. Use demo@eldercare.com / password123');
      }
    }
  };

  const handleProfileComplete = () => {
    // Create user account
    login({
      id: Date.now().toString(),
      fullName: tempUserData?.fullName || 'User',
      email: tempUserData?.email,
      phone: tempUserData?.phone,
      role: 'senior',
      isVerified: true,
    });
  };

  const handlePasswordResetSent = () => {
    setScreen('reset-sent');
  };

  return (
    <>
      {screen === 'splash' && (
        <SplashScreen
          onContinue={() => setScreen('login')}
        />
      )}

      {screen === 'login' && (
        <Login
          onLogin={handleLogin}
          onRegister={() => setScreen('register')}
          onForgotPassword={() => setScreen('forgot-password')}
        />
      )}

      {screen === 'register' && (
        <Register
          onNext={handleRegister}
          onBack={() => setScreen('login')}
        />
      )}

      {screen === 'verify-phone' && tempUserData?.phone && (
        <VerifyPhone
          phone={tempUserData.phone}
          onVerified={handlePhoneVerified}
          onBack={() => setScreen('register')}
        />
      )}

      {screen === 'forgot-password' && (
        <ForgotPassword
          onBack={() => setScreen('login')}
          onSent={handlePasswordResetSent}
        />
      )}

      {screen === 'reset-sent' && (
        <PasswordResetSent
          email={tempUserData?.email}
          phone={tempUserData?.phone}
          onBackToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'profile-verified' && (
        <ProfileVerified
          userName={tempUserData?.fullName?.split(' ')[0] || 'there'}
          onContinue={handleProfileComplete}
        />
      )}
    </>
  );
}