'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import KPICard from './components/KPICard';
import AlertCard from './components/AlertCard';
import { apiCall } from '@/lib/auth';
import Link from 'next/link';

export default function Home() {
  const [summary, setSummary] = useState<any>(null);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const response = await apiCall('/Flight/activity?page=1');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Fetch recent alerts (unmatched events)
  const fetchRecentAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
    try {
      const response = await apiCall('/Flight/activity?status=unmatched&page=1');
      if (response.ok) {
        const data = await response.json();
        // Ensure we only show truly unmatched items (some backends may ignore the filter)
        const events = Array.isArray(data?.events) ? data.events : [];
        const unmatchedOnly = events.filter((e: any) => e?.matched === false || e?.alertStatus === 'unmatched');
        setRecentAlerts(unmatchedOnly.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      setRecentAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchRecentAlerts();
  }, [fetchSummary, fetchRecentAlerts]);

  // Format trend text
  const formatTrend = (value: number, label: string) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value} ${label}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col">
      <Header activeTab="operations" />

      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Operations Control Center</h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <KPICard
            title="Active Transit Flights"
            value={isLoadingSummary ? '...' : (summary?.activeTransitFlights?.toString() || '0')}
            // API doesn't provide a trend for this metric; keep UI honest by not guessing
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          />
          <KPICard
            title="Passengers Verified"
            value={isLoadingSummary ? '...' : (summary?.passengersVerified?.toLocaleString() || '0')}
            subtitle={summary?.verificationAccuracy ? `${summary.verificationAccuracy.toFixed(1)}% accuracy` : undefined}
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <KPICard
            title="Active Discrepancies"
            value={isLoadingSummary ? '...' : (summary?.activeDiscrepancies?.toString() || '0')}
            trend={summary?.discrepancyTrend !== undefined ? formatTrend(summary.discrepancyTrend, 'from last hour') : undefined}
            trendUp={summary?.discrepancyTrend !== undefined ? summary.discrepancyTrend < 0 : true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <KPICard
            title="System Uptime"
            value={isLoadingSummary ? '...' : (summary?.systemUptime ? `${summary.systemUptime.toFixed(2)}%` : '99.99%')}
            subtitle="Last 30 days"
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
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
          <Link href="/analytics-reports" className="flex items-center gap-1 sm:gap-2 pb-3 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Analytics & Reports</span>
            <span className="sm:hidden">Analytics</span>
          </Link>
        </div>

      </main>

    </div>
  );
}
