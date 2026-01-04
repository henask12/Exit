'use client';

import React from 'react';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';

interface FlightSelectionProps {
  station: string;
  flightDate: string;
  flightNumber: string;
  flightNumbers: number[];
  isLoadingFlights: boolean;
  onDateChange: (date: string) => void;
  onFlightNumberChange: (flightNumber: string) => void;
  onStartScanning: () => void;
}

export function FlightSelection({
  station,
  flightDate,
  flightNumber,
  flightNumbers,
  isLoadingFlights,
  onDateChange,
  onFlightNumberChange,
  onStartScanning,
}: FlightSelectionProps) {
  const getDateOptions = () => {
    const today = new Date();
    const dates = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        label: i === 0 ? 'Today' : i === -1 ? 'Yesterday' : 'Tomorrow',
        value: date.toISOString().split('T')[0],
        date: date,
      });
    }
    return dates;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Flight</h2>
          <p className="text-sm text-gray-600">Choose your flight date and number to begin scanning</p>
        </div>

        {/* Station Display */}
        {station && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-[#00A651] text-white px-4 py-2 rounded-lg font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Station: {station}</span>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Date</label>
          <select
            value={flightDate}
            onChange={(e) => {
              onDateChange(e.target.value);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
          >
            <option value="">Select Date</option>
            {getDateOptions().map((dateOption) => (
              <option key={dateOption.value} value={dateOption.value}>
                {dateOption.label} ({dateOption.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </option>
            ))}
          </select>
        </div>

        {/* Flight Number Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Number</label>
          <select
            value={flightNumber}
            onChange={(e) => onFlightNumberChange(e.target.value)}
            disabled={isLoadingFlights}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {isLoadingFlights ? 'Loading flights...' : 'Select Flight'}
            </option>
            {flightNumbers.map((flight, index) => (
              <option key={index} value={String(flight)}>
                {flight}
              </option>
            ))}
          </select>
        </div>

        {/* Proceed Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onStartScanning();
          }}
          disabled={!flightNumber || !flightDate || isLoadingFlights}
          className="w-full bg-[#00A651] text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-[#008a43] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 flex items-center justify-center gap-2"
        >
          {isLoadingFlights ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Start Scanning
            </>
          )}
        </button>
      </div>
    </div>
  );
}

