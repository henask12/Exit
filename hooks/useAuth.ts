import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(auth.getUser());

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      setUser(auth.getUser());
      setIsChecking(false);

      if (!authenticated && !window.location.pathname.includes('/login')) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    auth.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return { isAuthenticated, isChecking, user, logout };
}

