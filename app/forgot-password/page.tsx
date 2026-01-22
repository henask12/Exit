'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/auth';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function ForgotPasswordPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setIsSubmitting(true);
      const res = await authAPI.forgotPassword(employeeId.trim());
      setMessage(
        res?.message ||
          'If the employee ID and email match, a password reset link has been sent to your email address.'
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0-3.314 2.686-6 6-6m-6 6c0 3.314 2.686 6 6 6m-6-6H6m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-600 mt-1">
            Enter your Employee ID. If it exists, we’ll send a reset link to the email on file.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="00028804"
            autoComplete="username"
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              {message}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset Link
          </Button>

          <div className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-[#00A651] hover:text-[#008a43] font-semibold">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


