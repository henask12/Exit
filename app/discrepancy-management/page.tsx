import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DiscrepancyManagement() {
  const summaryCards = [
    { title: 'Open Discrepancies', value: '1', color: 'text-red-600', bgColor: 'bg-red-50', icon: 'warning' },
    { title: 'Under Investigation', value: '1', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: 'clock' },
    { title: 'Resolved Today', value: '1', color: 'text-green-600', bgColor: 'bg-green-50', icon: 'check' }
  ];

  const discrepancies = [
    {
      type: 'Count Mismatch',
      status: 'INVESTIGATING',
      statusColor: 'bg-yellow-100 text-yellow-700',
      priority: 'HIGH',
      priorityColor: 'bg-orange-100 text-orange-700',
      flight: 'ET 302',
      description: 'Passenger count mismatch: 2 passengers scanned but not on disembarkation manifest',
      affectedPassengers: 2,
      reportedTime: '14:32',
      reportedBy: 'Crew Member Sarah J.',
      assignedTo: 'Ground Supervisor Mike R.',
      iconColor: 'text-orange-600'
    },
    {
      type: 'Verification Failed',
      status: 'RESOLVED',
      statusColor: 'bg-green-100 text-green-700',
      priority: 'MEDIUM',
      priorityColor: 'bg-yellow-100 text-yellow-700',
      flight: 'ET 500',
      description: 'Boarding pass verification failed for passenger due to damaged QR code',
      affectedPassengers: 1,
      reportedTime: '13:45',
      reportedBy: 'System Auto-detect',
      assignedTo: 'Gate Agent Lisa M.',
      iconColor: 'text-yellow-600'
    },
    {
      type: 'System Error',
      status: 'OPEN',
      statusColor: 'bg-red-100 text-red-700',
      priority: 'CRITICAL',
      priorityColor: 'bg-red-100 text-red-700',
      flight: 'ET 608',
      description: 'Sabre PSS connection timeout - unable to sync latest manifest updates',
      affectedPassengers: 67,
      reportedTime: '15:02',
      reportedBy: 'System Monitor',
      assignedTo: 'IT Support Team',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="operations" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
          <Link href="/flight-monitor" className="flex items-center gap-1 sm:gap-2 pb-3 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="hidden sm:inline">Flight Monitor</span>
            <span className="sm:hidden">Monitor</span>
          </Link>
          <button className="flex items-center gap-1 sm:gap-2 pb-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="hidden sm:inline">Discrepancy Management</span>
            <span className="sm:hidden">Discrepancy</span>
          </button>
          <Link href="/analytics-reports" className="flex items-center gap-1 sm:gap-2 pb-3 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Analytics & Reports</span>
            <span className="sm:hidden">Analytics</span>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {summaryCards.map((card) => (
            <div key={card.title} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${card.bgColor}`}>
                  {card.icon === 'warning' && (
                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {card.icon === 'clock' && (
                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {card.icon === 'check' && (
                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">{card.title}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Discrepancies */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Active Discrepancies</h3>
          <div className="space-y-3 sm:space-y-4">
            {discrepancies.map((disc, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                    disc.iconColor === 'text-orange-600' ? 'bg-orange-50' :
                    disc.iconColor === 'text-yellow-600' ? 'bg-yellow-50' :
                    'bg-red-50'
                  }`}>
                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${disc.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-sm sm:text-base text-gray-900">{disc.flight}</span>
                      <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${disc.priorityColor}`}>
                        {disc.priority}
                      </span>
                      <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${disc.statusColor}`}>
                        {disc.status}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{disc.type}</h4>
                    <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">{disc.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Affected Passengers</p>
                        <p className="text-sm font-semibold text-gray-900">{disc.affectedPassengers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reported Time</p>
                        <p className="text-sm font-semibold text-gray-900">{disc.reportedTime}</p>
                        <p className="text-xs text-gray-500 mt-1">Reported By</p>
                        <p className="text-sm text-gray-900">{disc.reportedBy}</p>
                        <p className="text-xs text-gray-500 mt-1">Assigned To</p>
                        <p className="text-sm text-gray-900">{disc.assignedTo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer activeTab="discrepancy-management" />
    </div>
  );
}

