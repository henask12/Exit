import Link from 'next/link';

interface FooterProps {
  activeTab?: 'flight-monitor' | 'discrepancy-management' | 'analytics-reports';
}

export default function Footer({ activeTab = 'flight-monitor' }: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 shadow-sm">
      <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-wrap">
        <Link 
          href="/flight-monitor" 
          className={`flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
            activeTab === 'flight-monitor' ? 'text-[#00A651] border-b-2 border-[#00A651] pb-1 font-semibold' : 'text-gray-700 hover:text-[#00A651]'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="hidden xs:inline">Flight Monitor</span>
        </Link>
        <Link 
          href="/discrepancy-management" 
          className={`flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
            activeTab === 'discrepancy-management' ? 'text-[#00A651] border-b-2 border-[#00A651] pb-1 font-semibold' : 'text-gray-700 hover:text-[#00A651]'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="hidden xs:inline">Discrepancy Management</span>
        </Link>
        <Link 
          href="/analytics-reports" 
          className={`flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
            activeTab === 'analytics-reports' ? 'text-[#00A651] border-b-2 border-[#00A651] pb-1 font-semibold' : 'text-gray-700 hover:text-[#00A651]'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden xs:inline">Analytics & Reports</span>
        </Link>
      </nav>
      <button className="text-gray-700 hover:text-[#00A651] self-start sm:self-auto transition-colors">
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </footer>
  );
}

