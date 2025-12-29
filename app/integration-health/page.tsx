import Header from '../components/Header';
import Footer from '../components/Footer';

export default function IntegrationHealth() {
  const integrations = [
    {
      name: 'Sabre PSS',
      status: 'healthy',
      statusText: 'Online',
      latency: '120ms',
      lastSync: '2 min ago',
      icon: 'database'
    },
    {
      name: 'Mobile Scanner API',
      status: 'healthy',
      statusText: 'Online',
      latency: '45ms',
      lastSync: '1 min ago',
      icon: 'mobile'
    },
    {
      name: 'Verification Service',
      status: 'warning',
      statusText: 'Degraded',
      latency: '850ms',
      lastSync: '5 min ago',
      icon: 'server'
    },
    {
      name: 'Notification Service',
      status: 'healthy',
      statusText: 'Online',
      latency: '80ms',
      lastSync: '30 sec ago',
      icon: 'bell'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="integration-health" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Integration Health</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {integrations.map((integration) => (
            <div key={integration.name} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  integration.status === 'healthy' ? 'bg-green-100 text-green-700' :
                  integration.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {integration.statusText}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{integration.name}</h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Latency:</span>
                  <span className="font-medium text-gray-900">{integration.latency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-medium text-gray-900">{integration.lastSync}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">All critical systems operational</span>
              </div>
              <span className="text-sm text-gray-600">99.99% uptime</span>
            </div>
          </div>
        </div>
      </main>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}

