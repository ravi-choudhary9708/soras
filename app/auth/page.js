"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCardHeader from './components/authCardHeader';
import LoginForm from './components/loginForm';
import RegisterForm from './components/registerForm';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const router = useRouter();

  // Handle successful registration event bubble from child form
  const handleRegisterSuccess = (result, selectedRole) => {
    setIsLoading(true);
    setFeedback({
      type: 'success',
      message: result.message || `🎉 ${selectedRole === 'manager' ? 'Manager' : 'User'} account created successfully! Redirecting...`
    });

    // Handle smooth transition redirect based on role structure
    setTimeout(() => {
      if (selectedRole === 'manager') {
        router.push('/dashboard/setup');
      } else {
        router.push('/dashboard');
      }
    }, 1500);
  };

  // Handle successful login event bubble from child form (supporting both split endpoints)
  const handleLoginSuccess = (result, selectedRole) => {
    setIsLoading(true);
    setFeedback({
      type: 'success',
      message: result.message || '🎉 Authentication successful! Loading your dashboard...'
    });

    // Route to correct layout views depending on user permissions
    setTimeout(() => {
      if (selectedRole === 'manager') {
        router.push('/dashboard/setup');
      } else {
        router.push('/dashboard');
      }
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-start pt-12 pb-16 px-6 overflow-x-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute top-[-50px] left-[-60px] w-48 h-48 bg-[#EEEDFD] rounded-3xl transform rotate-12 -z-10" />
      <div className="absolute top-[-80px] right-[-60px] w-64 h-64 bg-[#EEEDFD] rounded-full -z-10 opacity-70" />

      {/* Brand Soras Header Section */}
      <div className="flex flex-col items-center mb-8 text-center">
        {/* Fixed Pixel-Perfect Logo Container */}
        <div className="w-28 h-28 flex items-center justify-center mb-2 flex-shrink-0">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="sorasOrangeGrad" x1="0" y1="100" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="100%" stopColor="#FF3D00" />
              </linearGradient>
            </defs>
            <g fill="url(#sorasOrangeGrad)">
              <circle cx="28" cy="100" r="8" />
              <rect x="42" y="70" width="45" height="14" rx="7" />
              <rect x="58" y="93" width="35" height="14" rx="7" />
              <rect x="42" y="116" width="55" height="14" rx="7" />
              <circle cx="130" cy="100" r="54" />
            </g>
            <g fill="#FFFFFF">
              <path d="M117 74 c-8 0 -13 9 -13 19 c0 11 5 19 13 19 c4 0 7 -2 9 -6 v26 c0 2 1.5 3.5 3.5 3.5 h2 c2 0 3.5 -1.5 3.5 -3.5 v-26 c2 4 5 6 9 6 c8 0 13 -8 13 -19 c0 -10 -5 -19 -13 -19 c-4 0 -7 2 -9 6 c-2 -4 -5 -6 -9 -6 z" fill="none" />
              <path d="M116 72 c-7 0 -11 7 -11 17 c0 9 4 16 11 16 c6 0 10 -6 11 -14 l0.5 -3 c0 -9 -4 -16 -11 -16 z" />
              <path d="M114.5 103.5 c0 0 1 14.5 1 21.5 c0 2 1 3 2.5 3 h0 c1.5 0 2.5 -1 2.5 -3 c0 -7 1 -21.5 1 -21.5 z" />
              <path d="M144 125 v-21.5 c3 -1 5 -4.5 5 -8.5 v-21 c0 -1.5 -1 -2.5 -2.5 -2.5 h-1 c-1.5 0 -2.5 1 -2.5 2.5 v16 h-3 v-16 c0 -1.5 -1 -2.5 -2.5 -2.5 h-1 c-1.5 0 -2.5 1 -2.5 2.5 v16 h-3 v-16 c0 -1.5 -1 -2.5 -2.5 -2.5 h-1 c-1.5 0 -2.5 1 -2.5 2.5 v21 c0 4 2 7.5 5 8.5 v21.5 c0 2 1 3 2.5 3 h1 c1.5 0 2.5 -1 2.5 -3 z" />
            </g>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-[#1A1A1A] tracking-wider uppercase mb-0.5">Soras</h1>
        <p className="text-xs text-[#8C8C8C] tracking-widest font-bold uppercase">Restaurant Management</p>
      </div>

      {/* Smooth Global Feedback Banners */}
      {feedback.message && (
        <div className={`w-full max-w-md p-4 mb-4 text-xs font-semibold rounded-xl text-center border animate-fadeIn transition-all duration-300 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Tabs Selector Toggle */}
      <div className="w-full max-w-md bg-[#F4F4F6] p-1.5 rounded-2xl flex justify-between mb-6">
        <button 
          disabled={isLoading}
          onClick={() => {
            setActiveTab('login');
            setFeedback({ type: '', message: '' });
          }} 
          className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === 'login' ? 'bg-[#5D44FF] text-white shadow-md shadow-[#5D44FF]/20' : 'text-[#626264] disabled:opacity-50'}`}
        >
          Login
        </button>
        <button 
          disabled={isLoading}
          onClick={() => {
            setActiveTab('register');
            setFeedback({ type: '', message: '' });
          }} 
          className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === 'register' ? 'bg-[#5D44FF] text-white shadow-md shadow-[#5D44FF]/20' : 'text-[#626264] disabled:opacity-50'}`}
        >
          Register
        </button>
      </div>

      {/* Dynamic Form Wrapper Card */}
      <div className="w-full max-w-md bg-white border border-[#F2F1FA] rounded-2xl p-6 shadow-sm shadow-[#5D44FF]/5">
        <AuthCardHeader type={activeTab} />

        {activeTab === 'login' ? (
          <LoginForm 
            onSubmit={(result, role) => handleLoginSuccess(result, role)} 
          />
        ) : (
          <RegisterForm 
            onSubmit={(result, role) => handleRegisterSuccess(result, role)} 
          />
        )}
      </div>
    </div>
  );
}