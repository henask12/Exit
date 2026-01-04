'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/auth';
import { useState, useEffect } from 'react';

interface HeaderProps {
  activeTab?: 'operations' | 'mobile-scanner' | 'integration-health' | 'settings';
}

export default function Header({ activeTab = 'operations' }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  const handleLogout = () => {
    auth.clearAuth();
    router.push('/login');
  };

  return (
    <header className="bg-[#1e3a5f] text-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-semibold">PVS Control Center</h1>
          <p className="text-xs sm:text-sm text-blue-200 hidden sm:block">Passenger Verification System</p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <nav className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-wrap">
        <Link 
          href="/" 
          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-colors text-xs sm:text-sm ${
            activeTab === 'operations' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Operations</span>
          </div>
        </Link>
        <Link 
          href="/mobile-scanner" 
          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-colors text-xs sm:text-sm ${
            activeTab === 'mobile-scanner' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Mobile Scanner</span>
          </div>
        </Link>
        <Link 
          href="/integration-health" 
          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-colors text-xs sm:text-sm ${
            activeTab === 'integration-health' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Integration Health</span>
          </div>
        </Link>
        <Link 
          href="/settings" 
          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full transition-colors text-xs sm:text-sm ${
            activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-blue-700'
          }`}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </div>
        </Link>
        </nav>
        
        {/* User Info and Logout */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-blue-600">
            <div className="hidden sm:block text-right">
              <p className="text-xs sm:text-sm font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-blue-200">{user.station?.code || user.stationCode} • {user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

