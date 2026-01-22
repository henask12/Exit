'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/auth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { loginSchema } from '@/lib/validations';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '../components/ui/NotificationToast';

export default function LoginPage() {
  const router = useRouter();
  const { addNotification, notifications, removeNotification } = useNotifications();
  const { validate, getFieldError, setFieldTouched } = useFormValidation(loginSchema);
  const [formData, setFormData] = useState({ employeeId: '00028804', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate(formData)) {
      addNotification('error', 'Validation Error', 'Please check your input');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.login(formData.employeeId, formData.password);
      addNotification('success', 'Login Successful', 'Redirecting...');
      setTimeout(() => router.push('/'), 500);
    } catch (error: any) {
      addNotification('error', 'Login Failed', error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 relative">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      {/* Dark Mode Toggle - Top Right */}
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-800 transition-colors">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">ExitCheck</h1>
          <p className="text-sm font-semibold text-[#00A651] uppercase mb-1">ETHIOPIAN AIRLINES</p>
          <p className="text-sm text-gray-500">System Administration & Verification</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => {
                  setFormData({ ...formData, employeeId: e.target.value });
                  setFieldTouched('employeeId');
                }}
                onBlur={() => setFieldTouched('employeeId')}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                placeholder="00028804"
                required
              />
            </div>
            {getFieldError('employeeId') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('employeeId')}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setFieldTouched('password');
                }}
                onBlur={() => setFieldTouched('password')}
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {getFieldError('password') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
            )}
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#00A651] border-gray-300 rounded focus:ring-[#00A651]"
              />
              <span className="ml-2 text-sm text-gray-500">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-[#00A651] hover:text-[#008a43] transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00A651] text-white px-6 py-3 rounded-lg font-semibold text-base uppercase hover:bg-[#008a43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

