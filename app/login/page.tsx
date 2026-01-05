'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/auth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { loginSchema } from '@/lib/validations';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '../components/ui/NotificationToast';

export default function LoginPage() {
  const router = useRouter();
  const { addNotification, notifications, removeNotification } = useNotifications();
  const { validate, getFieldError, setFieldTouched } = useFormValidation(loginSchema);
  const [formData, setFormData] = useState({ employeeId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen bg-[#1e3a5f] flex items-center justify-center px-4">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ExitCheck</h1>
          <p className="text-gray-600">Ethiopian Airlines</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Employee ID"
            type="text"
            value={formData.employeeId}
            onChange={(e) => {
              setFormData({ ...formData, employeeId: e.target.value });
              setFieldTouched('employeeId');
            }}
            onBlur={() => setFieldTouched('employeeId')}
            error={getFieldError('employeeId')}
            placeholder="00028804"
            required
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setFieldTouched('password');
              }}
              onBlur={() => setFieldTouched('password')}
              error={getFieldError('password')}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="mt-1 text-sm text-blue-600 hover:text-blue-800"
            >
              {showPassword ? 'Hide' : 'Show'} Password
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

