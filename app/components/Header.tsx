'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  activeTab?: 'operations' | 'mobile-scanner' | 'integration-health' | 'settings' | 'master-data' | 'account-management';
}

export default function Header({ activeTab = 'operations' }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showMasterData, setShowMasterData] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const masterDataRef = useRef<HTMLDivElement>(null);
  const accountManagementRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Only get user data on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setUserData(user || null);
  }, [user]);

  const isAdmin = (userData?.role || user?.role || '').toString().toLowerCase() === 'admin';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (masterDataRef.current && !masterDataRef.current.contains(event.target as Node)) {
        setShowMasterData(false);
      }
      if (accountManagementRef.current && !accountManagementRef.current.contains(event.target as Node)) {
        setShowAccountManagement(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#1a4d2e] text-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#00A651]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="4" rx="1"/>
              <rect x="3" y="10" width="18" height="4" rx="1"/>
              <rect x="3" y="16" width="18" height="4" rx="1"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Ethiopian Passenger Verification</h1>
            <p className="text-xs sm:text-sm text-green-200 hidden sm:block">VERIFICATION SYSTEM</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
          <Link 
            href="/" 
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'operations' ? 'bg-[#00A651] text-white' : 'text-white hover:bg-[#008a43]'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Operations</span>
          </Link>
          
          <Link 
            href="/mobile-scanner" 
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'mobile-scanner' ? 'bg-[#00A651] text-white' : 'text-white hover:bg-[#008a43]'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Mobile Scanner</span>
          </Link>

          {/* Master Data Dropdown */}
          <div className="relative" ref={masterDataRef}>
            <button
              onClick={() => {
                setShowMasterData(!showMasterData);
                setShowAccountManagement(false);
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'master-data' ? 'bg-[#00A651] text-white' : 'text-white hover:bg-[#008a43]'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Master Data</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showMasterData && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                <Link
                  href="/station-management"
                  onClick={() => setShowMasterData(false)}
                  className="block px-4 py-3 text-gray-900 hover:bg-gray-100 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Stations
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Account Management Dropdown */}
          <div className="relative" ref={accountManagementRef}>
            <button
              onClick={() => {
                setShowAccountManagement(!showAccountManagement);
                setShowMasterData(false);
              }}
              className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${
                activeTab === 'account-management' ? 'bg-[#00A651] text-white' : 'text-white hover:bg-[#008a43]'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Account Management</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAccountManagement && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                <Link
                  href="/role-management"
                  onClick={() => setShowAccountManagement(false)}
                  className="block px-4 py-3 text-gray-900 hover:bg-gray-100 transition-colors text-sm border-b border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Roles
                  </div>
                </Link>
                <Link
                  href="/user-management"
                  onClick={() => setShowAccountManagement(false)}
                  className="block px-4 py-3 text-gray-900 hover:bg-gray-100 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Users
                  </div>
                </Link>
              </div>
            )}
          </div>
          
          <Link 
            href="/integration-health" 
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'integration-health' ? 'bg-[#00A651] text-white' : 'text-white hover:bg-[#008a43]'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Integration Health</span>
          </Link>

          {/* Station Code & Profile */}
          {mounted && userData && (
            <div className="flex items-center gap-3 ml-auto">
              {/* Station Code Badge with Blue Dot */}
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-800 rounded-lg flex items-center gap-2 shadow-md">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-white font-semibold text-xs sm:text-sm">
                  {userData.station?.code || 'N/A'}
                </span>
              </div>

              {/* Profile Icon with Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowMasterData(false);
                    setShowAccountManagement(false);
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow relative"
                >
                  <span className="text-white font-bold text-sm sm:text-base">
                    {userData.firstName && userData.lastName
                      ? `${userData.firstName.charAt(0).toUpperCase()}${userData.lastName.charAt(0).toUpperCase()}`
                      : userData.firstName
                      ? userData.firstName.charAt(0).toUpperCase()
                      : 'U'}
                  </span>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-orange-600 rounded-full flex items-center justify-center border border-[#1a4d2e]">
                    <svg className="w-1.5 h-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {userData.firstName && userData.lastName 
                            ? `${userData.firstName} ${userData.lastName}`
                            : 'User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {userData.station?.code || 'N/A'} • {userData.role || 'Admin'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          router.push('/profile');
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </div>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            router.push('/profile#admin-reset-password');
                          }}
                          className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 11V7a4 4 0 118 0v4m-8 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2"
                              />
                            </svg>
                            Reset Password
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
