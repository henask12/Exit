'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { authAPI } from '@/lib/auth';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialEmployeeId = useMemo(() => searchParams.get('employeeId') || '', [searchParams]);
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authAPI.resetPassword(employeeId.trim(), token.trim(), newPassword);
      setMessage(res?.message || 'Password reset successfully');
      setTimeout(() => router.push('/login'), 800);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
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
                d="M12 11V7a4 4 0 118 0v4m-8 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-600 mt-1">Paste the token from your email and set a new password.</p>
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

          <Input
            label="Reset Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste token from email"
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordMismatch ? 'Passwords do not match.' : undefined}
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

          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={passwordMismatch}>
            Reset Password
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


