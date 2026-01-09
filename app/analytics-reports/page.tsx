'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import KPICard from '../components/KPICard';
import { apiCall } from '@/lib/auth';

export default function AnalyticsReports() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [performancePage, setPerformancePage] = useState(1);
  const performancePageSize = 8;
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // 30 days ago
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Fetch KPIs
  const fetchKPIs = useCallback(async () => {
    setIsLoadingKpis(true);
    try {
      const response = await apiCall('/Flight/analytics/kpis');
      if (response.ok) {
        const data = await response.json();
        // API returns an object with KPI keys (verificationAccuracy, avgProcessingTime, discrepancyRate, systemUptime)
        const obj = data && typeof data === 'object' ? data : null;
        if (obj && !Array.isArray(obj)) {
          const mapped = [
            { title: 'Verification Accuracy', ...(obj.verificationAccuracy || {}) },
            { title: 'Avg Processing Time', ...(obj.avgProcessingTime || {}) },
            { title: 'Discrepancy Rate', ...(obj.discrepancyRate || {}) },
            { title: 'System Uptime', ...(obj.systemUptime || {}) },
          ].filter((k) => k.value !== undefined);
          setKpis(mapped);
        } else {
          setKpis(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setKpis([]);
    } finally {
      setIsLoadingKpis(false);
    }
  }, []);

  // Fetch performance data
  const fetchPerformance = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
      });

      const response = await apiCall(`/Flight/analytics/performance?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const flights = Array.isArray(data) ? data : (data?.flights || []);
        setPerformanceData(Array.isArray(flights) ? flights : []);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setPerformanceData([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Reset perf pagination when date range changes / data changes
  useEffect(() => {
    setPerformancePage(1);
  }, [startDate, endDate]);

  // Format KPI value
  const formatKPIValue = (kpi: any) => {
    if (kpi.title === 'Verification Accuracy' || kpi.title === 'System Uptime') {
      return `${kpi.value}%`;
    }
    if (kpi.title === 'Avg Processing Time') {
      return `${kpi.value}s`;
    }
    if (kpi.title === 'Discrepancy Rate') {
      return `${kpi.value}%`;
    }
    return kpi.value?.toString() || '0';
  };

  const formatTarget = (kpi: any) => {
    if (kpi.target === undefined || kpi.target === null) return 'N/A';
    if (kpi.title === 'Avg Processing Time') return `< ${kpi.target}s`;
    if (kpi.title === 'Verification Accuracy' || kpi.title === 'System Uptime' || kpi.title === 'Discrepancy Rate') return `${kpi.target}%`;
    return String(kpi.target);
  };

  // Format trend
  const formatTrend = (kpi: any) => {
    const trend = kpi.trend || 0;
    const isPositive = trend > 0;
    const prefix = isPositive ? '+' : '';
    
    if (kpi.title === 'Verification Accuracy' || kpi.title === 'System Uptime' || kpi.title === 'Discrepancy Rate') {
      return `${prefix}${trend}%`;
    }
    if (kpi.title === 'Avg Processing Time') {
      return `${prefix}${trend}s`;
    }
    return `${prefix}${trend}`;
  };

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

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 relative">
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {isLoadingKpis ? (
            <div className="col-span-full flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : kpis.length > 0 ? (
            kpis.map((kpi) => (
              <KPICard
                key={kpi.title || kpi.name}
                title={kpi.title || kpi.name}
                value={formatKPIValue(kpi)}
                trend={formatTrend(kpi)}
                subtitle={`Target: ${formatTarget(kpi)}`}
                trendUp={kpi.trend > 0 || kpi.trend === undefined}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              No KPI data available.
            </div>
          )}
        </div>

        {/* Flight Performance Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Flight Performance Metrics</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : performanceData.length > 0 ? (
            <>
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
                  {performanceData
                    .slice((performancePage - 1) * performancePageSize, performancePage * performancePageSize)
                    .map((flight) => (
                    <tr key={flight.flightNumber} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-sm sm:text-base text-gray-900">ET-{flight.flightNumber}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700">{flight.total || 0}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700">{flight.verified || 0}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div 
                              className={`h-1.5 sm:h-2 rounded-full ${
                                (flight.accuracy || 0) === 100 ? 'bg-green-600' : 
                                (flight.accuracy || 0) >= 95 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, flight.accuracy || 0)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-700">{flight.accuracy?.toFixed(1) || 0}%</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700">
                        {typeof flight.avgTimeSeconds === 'number' ? `${flight.avgTimeSeconds.toFixed(1)}s` : 'N/A'}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {flight.rating === 'excellent' ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ) : flight.rating === 'good' ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
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

              {/* Pagination (8/page) */}
              {Math.ceil(performanceData.length / performancePageSize) > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((performancePage - 1) * performancePageSize) + 1} to {Math.min(performancePage * performancePageSize, performanceData.length)} of {performanceData.length} flights
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPerformancePage((p) => Math.max(1, p - 1))}
                      disabled={performancePage === 1}
                      className="px-3 py-1.5 text-sm bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(performanceData.length / performancePageSize)) }, (_, i) => {
                        const total = Math.ceil(performanceData.length / performancePageSize);
                        let pageNum;
                        if (total <= 5) pageNum = i + 1;
                        else if (performancePage <= 3) pageNum = i + 1;
                        else if (performancePage >= total - 2) pageNum = total - 4 + i;
                        else pageNum = performancePage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPerformancePage(pageNum)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              performancePage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPerformancePage((p) => p + 1)}
                      disabled={performancePage >= Math.ceil(performanceData.length / performancePageSize)}
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
              <p>No performance data available for the selected date range.</p>
            </div>
          )}
        </div>
      </main>

      <Footer activeTab="analytics-reports" />
    </div>
  );
}
