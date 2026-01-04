import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { RecentAlerts } from './_components/RecentAlerts';
import { FilterBar } from './_components/FilterBar';
import { FlightTable, Flight } from './_components/FlightTable';

export default function FlightMonitor() {
  const flights: Flight[] = [
    {
      flight: 'ET 302',
      aircraft: 'B787-9',
      route: { origin: 'ADD', intermediate: 'DUB', destination: 'JFK' },
      gate: 'Gate A12',
      depTime: '10:30',
      arrTime: '14:45',
      passengers: { total: 287, disembarking: 42, continuing: 245 },
      verification: { verified: 40, total: 42 },
      status: 'BOARDING',
      statusVariant: 'default' // Blue
    },
    {
      flight: 'ET 608',
      aircraft: 'B777-300ER',
      route: { origin: 'ADD', intermediate: 'FCO', destination: 'IAD' },
      gate: 'Gate B8',
      depTime: '11:15',
      arrTime: '15:30',
      passengers: { total: 312, disembarking: 67, continuing: 245 },
      verification: { verified: 67, total: 67 },
      status: 'IN FLIGHT',
      statusVariant: 'info' // Purple
    },
    {
      flight: 'ET 500',
      aircraft: 'B787-8',
      route: { origin: 'ADD', intermediate: 'CAI', destination: 'BRU' },
      gate: 'Gate C15',
      depTime: '09:45',
      arrTime: '13:20',
      passengers: { total: 198, disembarking: 23, continuing: 175 },
      verification: { verified: 21, total: 23 },
      status: 'ARRIVED',
      statusVariant: 'neutral' // Gray
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="operations" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <RecentAlerts />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
          <button className="flex items-center gap-1 sm:gap-2 pb-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="hidden sm:inline">Flight Monitor</span>
            <span className="sm:hidden">Monitor</span>
          </button>
          <Link href="/discrepancy-management" className="flex items-center gap-1 sm:gap-2 pb-3 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="hidden sm:inline">Discrepancy Management</span>
            <span className="sm:hidden">Discrepancy</span>
          </Link>
          <Link href="/analytics-reports" className="flex items-center gap-1 sm:gap-2 pb-3 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Analytics & Reports</span>
            <span className="sm:hidden">Analytics</span>
          </Link>
        </div>

        <FilterBar />

        <FlightTable flights={flights} />
      </main>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}

