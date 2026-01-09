'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AlertCard from '../components/AlertCard';
import { apiCall } from '@/lib/auth';
import { auth } from '@/lib/auth';

export default function FlightMonitor() {
  const [flights, setFlights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [station, setStation] = useState<string>('');
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Get user station on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await auth.getUser();
      if (cancelled) return;
      const stationCode = user?.station?.code || 'GVA';
      setStation(stationCode);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch flights from API
  const fetchFlights = useCallback(async () => {
    if (!station) return; // Don't fetch if station is not loaded yet
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        station: station,
        page: currentPage.toString(),
        pageSize: '8',
      });

      const response = await apiCall(`/Flight/monitor?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFlights(data.flights || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setHasNextPage(data.hasNextPage || false);
        setHasPreviousPage(data.hasPreviousPage || false);
      } else {
        throw new Error('Failed to fetch flights');
      }
    } catch (error: any) {
      console.error('Error fetching flights:', error);
      setFlights([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, station, currentPage]);

  // Fetch flights when filters or page change
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  // Reset to page 1 when date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  // Fetch recent alerts (unmatched events)
  const fetchRecentAlerts = useCallback(async () => {
    if (!station) return;
    
    setIsLoadingAlerts(true);
    try {
      const response = await apiCall(`/Flight/activity?status=unmatched&page=1&station=${station}`);
      if (response.ok) {
        const data = await response.json();
        // Get first 3 unmatched events for recent alerts
        setRecentAlerts((data.events || []).slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      setRecentAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [station]);

  useEffect(() => {
    fetchRecentAlerts();
  }, [fetchRecentAlerts]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="operations" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Alerts</h3>
            <button className="text-[#00A651] hover:text-[#008a43] text-xs sm:text-sm font-semibold transition-colors">View All</button>
          </div>
          {isLoadingAlerts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A651]"></div>
            </div>
          ) : recentAlerts.length > 0 ? (
            <div className="space-y-4">
              {recentAlerts.map((alert, index) => {
                const alertType = alert.alertType || 'warning';
                const isUnmatched = alert.matched === false;
                const showResolve = isUnmatched || alertType === 'warning' || alertType === 'error';
                
                return (
                  <AlertCard
                    key={alert.id || index}
                    type={alertType === 'success' ? 'success' : alertType === 'error' ? 'error' : 'warning'}
                    code={`ET-${alert.flightNumber || 'N/A'}`}
                    time={alert.timeAgo || 'N/A'}
                    message={alert.matchReason || `${alert.passengerName || 'Passenger'} - Not matched to manifest`}
                    showResolve={showResolve}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No recent alerts</p>
            </div>
          )}
        </div>

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

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm sm:text-base">
            <span className="text-gray-600">Station:</span>
            <span className="font-semibold text-gray-900">{station || 'Loading...'}</span>
          </div>
        </div>

        {/* Flight Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : flights.length > 0 ? (
            <>
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FLIGHT</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROUTE</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PASSENGERS</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERIFICATION</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {flights.map((flight) => {
                      const verificationPercent = flight.verificationPercentage || 0;
                      const isComplete = verificationPercent >= 100;
                      const status = flight.status || 'UNKNOWN';
                      const statusColor = status === 'IN_PROGRESS' 
                        ? 'bg-blue-100 text-blue-700' 
                        : status === 'ARRIVED' 
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700';
                      
                      return (
                        <tr key={`${flight.flightNumber}-${flight.flightDate}`} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <div>
                                <div className="font-semibold text-gray-900">ET-{flight.flightNumber}</div>
                                <div className="text-sm text-gray-500">
                                  {flight.flightDate ? new Date(flight.flightDate).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {flight.route || flight.origin || 'N/A'}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Origin: {flight.origin || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <div className="text-xs sm:text-sm text-gray-900">
                                <div>{flight.totalPassengers || 0} total</div>
                                <div className="text-gray-500">{flight.disembarkingPassengers || 0} disembarking</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {isComplete ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                  {flight.verified || 0}/{flight.verificationTotal || flight.disembarkingPassengers || 0}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                                  <div 
                                    className={`h-1.5 sm:h-2 rounded-full ${isComplete ? 'bg-green-600' : 'bg-yellow-600'}`}
                                    style={{ width: `${Math.min(100, verificationPercent)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">{verificationPercent.toFixed(1)}%</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <Link 
                              href={`/mobile-scanner?flightNumber=${flight.flightNumber}&date=${flight.flightDate}&station=${station}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * 8) + 1} to {Math.min(currentPage * 8, totalCount)} of {totalCount} flights
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!hasPreviousPage || isLoading}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoading}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!hasNextPage || isLoading}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No flights found for the selected date and station.</p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}


