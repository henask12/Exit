import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import KPICard from '../components/KPICard';

export default function AnalyticsReports() {
  const kpis = [
    {
      title: 'Verification Accuracy',
      value: '99.996%',
      trend: '+0.002%',
      subtitle: 'Target: 99.9999%',
      trendUp: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Avg Processing Time',
      value: '1.8s',
      trend: '-0.3s',
      subtitle: 'Target: < 2s',
      trendUp: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Discrepancy Rate',
      value: '0.12%',
      trend: '-0.05%',
      subtitle: 'Target: < 0.5%',
      trendUp: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      title: 'System Uptime',
      value: '99.99%',
      trend: '+0.01%',
      subtitle: 'Target: 99.99%',
      trendUp: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  const flightMetrics = [
    { flight: 'ET 302', total: 287, verified: 287, accuracy: 100, avgTime: '1.5s', rating: 'gold' },
    { flight: 'ET 608', total: 312, verified: 310, accuracy: 99.4, avgTime: '1.9s', rating: 'down' },
    { flight: 'ET 500', total: 198, verified: 198, accuracy: 100, avgTime: '1.6s', rating: 'gold' },
    { flight: 'ET 404', total: 256, verified: 254, accuracy: 99.2, avgTime: '2.1s', rating: 'down' }
  ];

  const discrepancyBreakdown = [
    { type: 'Count Mismatch', count: 12 },
    { type: 'Verification Failed', count: 8 },
    { type: 'System Error', count: 5 },
    { type: 'Manual Override', count: 2 }
  ];

  const maxDiscrepancy = Math.max(...discrepancyBreakdown.map(d => d.count));

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
          <Link href="/discrepancy-management" className="flex items-center gap-1 sm:gap-2 pb-3 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="hidden sm:inline">Discrepancy Management</span>
            <span className="sm:hidden">Discrepancy</span>
          </Link>
          <button className="flex items-center gap-1 sm:gap-2 pb-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Analytics & Reports</span>
            <span className="sm:hidden">Analytics</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Verification Accuracy Trend</h3>
            <div className="flex items-end justify-between gap-2 h-48 mb-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-green-500 rounded-t mb-2"
                    style={{ height: `${60 + index * 8}%` }}
                  ></div>
                  <span className="text-xs text-gray-600">{month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Month</span>
              <span className="text-lg font-semibold text-green-600">99.996%</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Average Processing Time</h3>
            <div className="flex items-end justify-between gap-2 h-48 mb-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t mb-2"
                    style={{ height: '70%' }}
                  ></div>
                  <span className="text-xs text-gray-600">{month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Month</span>
              <span className="text-lg font-semibold text-blue-600">1.8s</span>
            </div>
          </div>
        </div>

        {/* Flight Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Flight Performance Metrics</h3>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">FLIGHT</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">TOTAL</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">VERIFIED</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">ACCURACY</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">AVG TIME</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">RATING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flightMetrics.map((flight) => (
                  <tr key={flight.flight} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-sm sm:text-base text-gray-900">{flight.flight}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700">{flight.total}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700">{flight.verified}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className={`h-1.5 sm:h-2 rounded-full ${flight.accuracy === 100 ? 'bg-green-600' : 'bg-orange-500'}`}
                            style={{ width: `${flight.accuracy}%` }}
                          ></div>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700">{flight.accuracy}%</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700">{flight.avgTime}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      {flight.rating === 'gold' ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Discrepancy Breakdown</h3>
            <div className="space-y-4">
              {discrepancyBreakdown.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.type}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.type === 'Count Mismatch' ? 'bg-red-500' :
                        item.type === 'Verification Failed' ? 'bg-orange-500' :
                        item.type === 'System Error' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(item.count / maxDiscrepancy) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Resolution Performance</h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Average Resolution Time</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">8.5 min</p>
                <p className="text-xs text-gray-500">Target: &lt; 15 min</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">First-Time Resolution Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">94.2%</p>
                <p className="text-xs text-gray-500">Target: &gt; 90%</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer activeTab="analytics-reports" />
    </div>
  );
}

