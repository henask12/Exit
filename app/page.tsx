'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import KPICard from './components/KPICard';
import AlertCard from './components/AlertCard';
import { auth } from '../lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Don't render if not authenticated (will redirect)
  if (!auth.isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header activeTab="operations" />
      
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Operations Control Center</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <KPICard
            title="Active Transit Flights"
            value="23"
            trend="+3 from yesterday"
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
          />
          <KPICard
            title="Passengers Verified"
            value="1,847"
            subtitle="98.9% accuracy"
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <KPICard
            title="Active Discrepancies"
            value="4"
            trend="-2 from last hour"
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <KPICard
            title="System Uptime"
            value="99.99%"
            subtitle="Last 30 days"
            trendUp={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Alerts</h3>
            <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            <AlertCard
              type="warning"
              code="ET 302"
              time="2 min ago"
              message="Passenger count mismatch detected - 2 passengers pending verification"
              showResolve={true}
            />
            <AlertCard
              type="success"
              code="ET 608"
              time="15 min ago"
              message="All passengers verified successfully for intermediate disembarkation"
            />
            <AlertCard
              type="error"
              code="ET 500"
              time="23 min ago"
              message="Sabre PSS connection latency detected - 8 seconds response time"
              showResolve={true}
            />
          </div>
        </div>
      </main>

      <Footer activeTab="flight-monitor" />
    </div>
  );
}
