"use client"; // Required for state management and user input events

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building, Phone, LogIn, ShieldAlert, CreditCard } from 'lucide-react';

export default function RegisterForm({ onSubmit }) {
  const [role, setRole] = useState('user'); // Set default to user
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to hold and render direct backend responses
  const [apiResponse, setApiResponse] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    // User fields
    email: '',
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Manager conditional fields
    restaurantName: '',
    restaurantUpiId: '',
    restaurantPhone: '',
    username: '',
    fullName: '',
  });

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setApiResponse({ type: '', message: '' }); // Clear notice on switch
    setFormData({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      restaurantName: '',
      restaurantUpiId: '',
      restaurantPhone: '',
      username: '',
      fullName: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setApiResponse({ type: '', message: '' });

    // Client-side password validation logic check for users
    if (role === 'user' && formData.password !== formData.confirmPassword) {
      setApiResponse({ type: 'error', message: "🚨 Passwords do not match!" });
      return;
    }

    // 1. Conditionally structure payloads AND select the matching API endpoint
    let targetEndpoint = '';
    let payload = {};

    if (role === 'user') {
      targetEndpoint = '/api/registerCustomer'; // Your user endpoint
      payload = {
        role,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };
    } else {
      targetEndpoint = '/api/onboardRestaurant'; // Your manager endpoint
      payload = {
        role,
        restaurantName: formData.restaurantName,
        restaurantUpiId: formData.restaurantUpiId,
        restaurantPhone: formData.restaurantPhone,
        email: formData.email,
        username: formData.username,
        fullName: formData.fullName,
        password: formData.password,
      };
    }

    setIsLoading(true);

    try {
      // 2. Hit the dynamically assigned endpoint URL
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed. Please try again.');
      }

      // Display Success parameters on frontend UI dashboard
      setApiResponse({
        type: 'success',
        message: result.message || `🎉 ${role === 'manager' ? 'Manager' : 'User'} account created successfully!`
      });

      // Pass details back up to optional root hooks wrapper context logic
      if (onSubmit) onSubmit(result);

    } catch (error) {
      setApiResponse({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Role Selection Segmented Toggle */}
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

      {/* Fieldset disables all internal input interactions dynamically during active processing */}
      <fieldset disabled={isLoading} className="space-y-5 border-none p-0 m-0 disabled:opacity-80 transition-opacity">
        
        {/* --- USER ROLE FIELDS --- */}
        {role === 'user' && (
          <>
            {/* Email Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Name</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="email"
                  name="email"
                  placeholder="ravichy@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="7859097347"
                  value={formData.phone}
                  onChange={handleInputChange}
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
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-11 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm tracking-wide font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
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

            {/* Confirm Password Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Confirm Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-11 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm tracking-wide font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-[#A4A2B2] hover:text-[#5D44FF] transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- MANAGER ROLE FIELDS --- */}
        {role === 'manager' && (
          <>
            {/* Restaurant Name Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Restaurant Name</label>
              <div className="relative flex items-center">
                <Building className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="text"
                  name="restaurantName"
                  placeholder="Soras Restaurant"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Restaurant UPI ID Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Restaurant UPI ID</label>
              <div className="relative flex items-center">
                <CreditCard className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="text"
                  name="restaurantUpiId"
                  placeholder="soras@oksbi"
                  value={formData.restaurantUpiId}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Restaurant Phone Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Restaurant Phone</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="tel"
                  name="restaurantPhone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.restaurantPhone}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Manager Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="email"
                  name="email"
                  placeholder="manager@soras.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Username Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Username</label>
              <div className="relative flex items-center">
                <ShieldAlert className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="text"
                  name="username"
                  placeholder="soras_manager"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
                  required
                />
              </div>
            </div>

            {/* Full Name Input */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A1A]">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-[#7A6EFE]" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Alex Mercer"
                  value={formData.fullName}
                  onChange={handleInputChange}
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
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-11 py-3.5 bg-white border border-[#E1DEFE] rounded-xl text-sm tracking-wide font-medium text-[#1A1A1A] placeholder-[#8E8D99] focus:outline-none focus:border-[#5D44FF] focus:ring-1 focus:ring-[#5D44FF] transition-all"
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
          </>
        )}
      </fieldset>

      {/* --- LIVE BACKEND RESPONSE DISPLAY BANNER --- */}
      {apiResponse.message && (
        <div className={`p-3.5 text-xs font-semibold rounded-xl text-center border transition-all animate-fadeIn ${
          apiResponse.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {apiResponse.message}
        </div>
      )}

      {/* Submit Button Component with Loader Spinner */}
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
            <span className="text-sm">Processing Registration...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span className="text-sm">Create Account</span>
          </>
        )}
      </button>
    </form>
  );
}