'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiCall } from '@/lib/auth';
import { auth } from '@/lib/auth';

export default function DiscrepancyManagement() {
  const [summary, setSummary] = useState<any>(null);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [station, setStation] = useState<string>('');

  // Get user station on mount
  useEffect(() => {
    const user = auth.getUser();
    if (user?.station) {
      const stationCode = typeof user.station === 'string' ? user.station : user.station?.code || '';
      setStation(stationCode);
    }
  }, []);

  // Fetch discrepancy summary
  const fetchSummary = useCallback(async () => {
    if (!station) return;
    
    try {
      const response = await apiCall(`/Flight/discrepancies/summary?station=${station}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching discrepancy summary:', error);
    }
  }, [station]);

  // Fetch discrepancies list
  const fetchDiscrepancies = useCallback(async () => {
    if (!station) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'unmatched',
        page: currentPage.toString(),
        pageSize: '8',
        station: station,
      });

      const response = await apiCall(`/Flight/activity?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDiscrepancies(data.events || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setHasNextPage(data.hasNextPage || false);
        setHasPreviousPage(data.hasPreviousPage || false);
      }
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
      setDiscrepancies([]);
    } finally {
      setIsLoading(false);
    }
  }, [station, currentPage]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchDiscrepancies();
  }, [fetchDiscrepancies]);

  // Reset to page 1 when station changes
  useEffect(() => {
    setCurrentPage(1);
  }, [station]);

  const summaryCards = [
    { 
      title: 'Open Discrepancies', 
      value: summary?.openDiscrepancies?.toString() || '0', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      icon: 'warning' 
    },
    { 
      title: 'Under Investigation', 
      value: summary?.underInvestigation?.toString() || '0', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      icon: 'clock' 
    },
    { 
      title: 'Resolved Today', 
      value: summary?.resolvedToday?.toString() || '0', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      icon: 'check' 
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : discrepancies.length > 0 ? (
            <>
              <div className="space-y-3 sm:space-y-4">
                {discrepancies.map((disc, index) => {
                  const status = disc.alertStatus || 'UNMATCHED';
                  const statusColor = status === 'RESOLVED' 
                    ? 'bg-green-100 text-green-700' 
                    : status === 'INVESTIGATING' 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700';
                  
                  const priority = disc.matchReason?.includes('CRITICAL') || disc.affectedPassengers > 10
                    ? 'CRITICAL'
                    : disc.affectedPassengers > 5
                    ? 'HIGH'
                    : 'MEDIUM';
                  
                  const priorityColor = priority === 'CRITICAL'
                    ? 'bg-red-100 text-red-700'
                    : priority === 'HIGH'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700';

                  return (
                    <div key={disc.id || index} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                          priority === 'CRITICAL' ? 'bg-red-50' :
                          priority === 'HIGH' ? 'bg-orange-50' :
                          'bg-yellow-50'
                        }`}>
                          <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            priority === 'CRITICAL' ? 'text-red-600' :
                            priority === 'HIGH' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-sm sm:text-base text-gray-900">ET-{disc.flightNumber}</span>
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                              {priority}
                            </span>
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {status}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                            {disc.matchReason || 'Unmatched Passenger'}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                            Passenger: {disc.passengerName || 'Unknown'} - {disc.matchReason || 'Not matched to manifest'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Route</p>
                              <p className="text-sm font-semibold text-gray-900">{disc.route || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Reported Time</p>
                              <p className="text-sm font-semibold text-gray-900">{disc.timeAgo || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">Scanned By</p>
                              <p className="text-sm text-gray-900">{disc.scannedBy || 'System'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * 8) + 1} to {Math.min(currentPage * 8, totalCount)} of {totalCount} discrepancies
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
              <p>No active discrepancies found.</p>
            </div>
          )}
        </div>
      </main>

      <Footer activeTab="discrepancy-management" />
    </div>
  );
}
