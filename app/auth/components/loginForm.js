"use client"; // Still required because this sub-component manages input state

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginForm({ onSubmit }) {
  const [role, setRole] = useState('user'); // Default to 'user' login endpoint
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Local state to instantly capture and show real response messages from your database
  const [apiResponse, setApiResponse] = useState({ type: '', message: '' });

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setApiResponse({ type: '', message: '' }); // Clear old messages on toggle
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiResponse({ type: '', message: '' });
    setIsLoading(true);

    // 1. Assign target path based on user or manager selections
    const targetEndpoint = role === 'user' 
      ? '/api/customerLogin' 
      : '/api/login';

    try {
      // 2. Fetch network execution
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Invalid login credentials.');
      }

      // 3. Render database response messages locally
      setApiResponse({
        type: 'success',
        message: result.message || '🎉 Login verification successful! Welcome back.'
      });

      // 4. Pass execution context up to parent routing parameters
      if (onSubmit) {
        onSubmit(result, role);
      }

    } catch (error) {
      setApiResponse({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Account Type Selector Toggle */}
      <div className="flex flex-col space-y-1.5">
        <label className="text-xs font-bold text-[#1A1A1A]">Select Account Type</label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F4F6] rounded-xl">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleRoleChange('user')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'user'
                ? 'bg-white text-[#5D44FF] shadow-sm'
                : 'text-[#626264] hover:text-[#1A1A1A] disabled:opacity-50'
            }`}
          >
            Standard User
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleRoleChange('manager')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'manager'
                ? 'bg-white text-[#5D44FF] shadow-sm'
                : 'text-[#626264] hover:text-[#1A1A1A] disabled:opacity-50'
            }`}
          >
            Restaurant Manager
          </button>
        </div>
      </div>

      <hr className="border-[#F2F1FA] my-2" />

      {/* Input Group Container Fieldset */}
      <fieldset disabled={isLoading} className="space-y-5 border-none p-0 m-0 disabled:opacity-80 transition-opacity">
        
        {/* Email Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-bold text-[#1A1A1A]">Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'manager' ? "manager@soras.com" : "ravichy@gmail.com"}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-xs font-bold text-[#1A1A1A]">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-11 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-[#A4A2B2] hover:text-[#5D44FF] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end pt-1">
        <a href="#forgot-password" className="text-xs font-bold text-[#5D44FF] hover:underline">
          Forgot Password?
        </a>
      </div>

      {/* Dynamic Backend Response Layout Alert Banner */}
      {apiResponse.message && (
        <div className={`p-3.5 text-xs font-semibold rounded-xl text-center border transition-all animate-fadeIn ${
          apiResponse.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {apiResponse.message}
        </div>
      )}

      {/* Core Dynamic Submit UI Action Button */}
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full mt-2 bg-[#5D44FF] hover:bg-[#4C34EC] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.99] shadow-md shadow-[#5D44FF]/10 disabled:bg-[#A4A2B2] disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Authenticating...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span className="text-sm">Login</span>
          </>
        )}
      </button>
    </form>
  );
}