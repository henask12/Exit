'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, User } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setIsChecking(true);
      const currentUser = await auth.getUser();
      if (cancelled) return;

      const authenticated = !!currentUser;
      setIsAuthenticated(authenticated);
      setUser(currentUser);
      setIsChecking(false);

      if (!authenticated && !window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = async () => {
    await auth.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return { isAuthenticated, isChecking, user, logout };
}

