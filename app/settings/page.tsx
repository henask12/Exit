import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="settings" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Settings</h2>
        
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">System Configuration</h3>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Timeout (seconds)
              </label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-sync Interval (minutes)
              </label>
              <input
                type="number"
                defaultValue="5"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enable Offline Mode
                </label>
                <p className="text-xs sm:text-sm text-gray-500">Allow scanning without internet connection</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors self-start sm:self-auto">
                <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition-transform"></span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Notifications
                </label>
                <p className="text-xs sm:text-sm text-gray-500">Receive alerts via email</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors self-start sm:self-auto">
                <span className="inline-block h-4 w-4 transform translate-x-1 rounded-full bg-white transition-transform"></span>
              </button>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <button className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base touch-manipulation">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}

