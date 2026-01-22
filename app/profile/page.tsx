'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/lib/auth';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

export default function ProfilePage() {
  const { isAuthenticated, isChecking, user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const initials = useMemo(() => {
    const fn = user?.firstName?.trim()?.[0]?.toUpperCase() || '';
    const ln = user?.lastName?.trim()?.[0]?.toUpperCase() || '';
    return (fn + ln) || 'U';
  }, [user?.firstName, user?.lastName]);

  const isAdmin = (user?.role || '').toString().toLowerCase() === 'admin';

  const [activeTab, setActiveTab] = useState<'change' | 'admin-reset'>('change');

  // Admin reset password (no token)
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminIsSubmitting, setAdminIsSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const adminPasswordMismatch =
    adminConfirmPassword.length > 0 && adminNewPassword !== adminConfirmPassword;

  // Respect deep-link from header: /profile#admin-reset-password
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      if (!isAdmin) {
        setActiveTab('change');
        return;
      }
      const hash = window.location.hash || '';
      if (hash === '#admin-reset-password') {
        setActiveTab('admin-reset');
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [isAdmin]);

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
      const res = await authAPI.changePassword(currentPassword, newPassword);
      setMessage(res?.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminMessage(null);

    if (adminNewPassword !== adminConfirmPassword) {
      setAdminError('Passwords do not match.');
      return;
    }

    try {
      setAdminIsSubmitting(true);
      const res = await authAPI.adminResetPassword(targetEmployeeId.trim(), adminNewPassword);
      setAdminMessage(res?.message || 'Password reset successfully by admin');
      setTargetEmployeeId('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err: any) {
      setAdminError(err?.message || 'Failed to reset password');
    } finally {
      setAdminIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#f5f7fa]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-gray-600">
            Loading…
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    // useAuth already redirects; keep UI simple.
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-600">
                {user?.employeeId} • {user?.station?.code || 'N/A'} • {user?.role || 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('change');
                  if (typeof window !== 'undefined') window.history.replaceState(null, '', '/profile');
                }}
                className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  activeTab === 'change'
                    ? 'text-[#00A651] border-[#00A651]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                Change Password
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin-reset');
                    if (typeof window !== 'undefined')
                      window.history.replaceState(null, '', '/profile#admin-reset-password');
                  }}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === 'admin-reset'
                      ? 'text-[#00A651] border-[#00A651]'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Reset Password (Admin)
                </button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'change' && (
              <div className="pt-6">
                <p className="text-sm text-gray-600">
                  Use your current password to set a new one. (Authenticated endpoint)
                </p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4 max-w-lg">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  {message && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      {message}
                    </div>
                  )}

                  <Button type="submit" isLoading={isSubmitting} disabled={passwordMismatch}>
                    Update Password
                  </Button>
                </form>
              </div>
            )}

            {isAdmin && activeTab === 'admin-reset' && (
              <div id="admin-reset-password" className="pt-6">
                <p className="text-sm text-gray-600">
                  This resets a user’s password directly (no email/token). Requires Admin session.
                </p>

                <form onSubmit={onAdminReset} className="mt-6 space-y-4 max-w-lg">
                  <Input
                    label="Employee ID"
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    placeholder="00028804"
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    error={adminPasswordMismatch ? 'Passwords do not match.' : undefined}
                    required
                  />

                  {adminError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {adminError}
                    </div>
                  )}
                  {adminMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      {adminMessage}
                    </div>
                  )}

                  <Button type="submit" isLoading={adminIsSubmitting} disabled={adminPasswordMismatch}>
                    Reset Password
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


