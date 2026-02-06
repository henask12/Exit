'use client';

import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  station: string;
  flightDetails: any;
  scannedPassengers: Set<string>;
  showRemainingPassengers: boolean;
  onToggleRemainingPassengers: () => void;
  scanStatus: 'loading' | 'success' | 'error' | null;
  recentScans: any[];
  onRemoveScan: (index: number) => void;
  isScanning?: boolean;
  cameraPermission?: 'prompt' | 'granted' | 'denied' | 'checking';
}

export function CameraView({
  videoRef,
  station,
  flightDetails,
  scannedPassengers,
  showRemainingPassengers,
  onToggleRemainingPassengers,
  scanStatus,
  recentScans,
  onRemoveScan,
  isScanning = false,
  cameraPermission = 'checking',
}: CameraViewProps) {
  const remainingPassengers = flightDetails?.disembarkingPassengers?.filter((p: any) => {
    const matchKey = `${p.pnrLocator || ''}_${p.seat || ''}`.toUpperCase();
    return !scannedPassengers.has(matchKey);
  }) || [];

  return (
    <>
      {/* Status Bar with Station and Flight Info */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {flightDetails && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold">ET{flightDetails.flightNumber}</span>
              <span className="text-gray-400">•</span>
              <span>{flightDetails.totalPassengers} Total</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Station Display */}
          <div className="flex items-center gap-2 bg-[#00A651] text-white px-3 py-1.5 rounded-lg font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{station}</span>
          </div>
        </div>
      </div>

      {/* Disembarking Passengers Status */}
      {flightDetails && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Disembarking</p>
                <p className="text-lg font-bold text-gray-900">{flightDetails.disembarkingPassengerCount}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Scanned & Matched</p>
                <p className={`text-lg font-bold ${scannedPassengers.size === flightDetails.disembarkingPassengerCount ? 'text-[#00A651]' : 'text-orange-600'}`}>
                  {scannedPassengers.size}
                </p>
              </div>
              {scannedPassengers.size === flightDetails.disembarkingPassengerCount && (
                <div className="flex items-center gap-1 text-[#00A651]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold">All Passengers Scanned</span>
                </div>
              )}
            </div>
            {flightDetails.disembarkingPassengerCount > scannedPassengers.size && (
              <button
                onClick={onToggleRemainingPassengers}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>View Remaining ({flightDetails.disembarkingPassengerCount - scannedPassengers.size})</span>
                <svg className={`w-4 h-4 transition-transform ${showRemainingPassengers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Remaining Passengers List */}
          {showRemainingPassengers && remainingPassengers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Remaining Passengers:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {remainingPassengers.map((passenger: any, index: number) => (
                  <div key={index} className="bg-white rounded p-2 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{passenger.passengerName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-600">Seat: {passenger.seat}</span>
                          {passenger.pnrLocator && (
                            <span className="text-xs text-gray-600">PNR: {passenger.pnrLocator}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Video Container */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          className="w-full h-full object-cover"
        />
        
        {/* Camera Status Overlay */}
        {!isScanning && cameraPermission === 'checking' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-lg font-semibold">Starting Camera...</p>
            </div>
          </div>
        )}
        
        {!isScanning && cameraPermission === 'denied' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
            <div className="text-center text-white p-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-lg font-semibold mb-2">Camera Access Denied</p>
              <p className="text-sm text-gray-300 mb-4">Please allow camera access in your browser settings</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )}
        
        {isScanning && !scanStatus && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Camera Active
          </div>
        )}
        
        {/* Scan Status Overlay */}
        {scanStatus && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            scanStatus === 'loading' ? 'bg-black bg-opacity-50' :
            scanStatus === 'success' ? 'bg-[#00A651] bg-opacity-90' :
            'bg-red-500 bg-opacity-90'
          }`}>
            {scanStatus === 'loading' && (
              <div className="text-center text-white">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-lg font-semibold">Processing...</p>
              </div>
            )}
            {scanStatus === 'success' && (
              <div className="text-center text-white">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg font-semibold">Success!</p>
              </div>
            )}
            {scanStatus === 'error' && (
              <div className="text-center text-white">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-lg font-semibold">Scan Failed</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Recent Scans ({recentScans.length})</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentScans.map((scan, index) => (
              <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200 flex items-center justify-between">
                <div className="flex-1">
                  {scan.passengerName && (
                    <p className="text-sm font-semibold text-gray-900">{scan.passengerName}</p>
                  )}
                  {scan.seat && (
                    <p className="text-xs text-gray-600">Seat: {scan.seat}</p>
                  )}
                  {scan.pnrLocator && (
                    <p className="text-xs text-gray-600">PNR: {scan.pnrLocator}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(scan.timestamp || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveScan(index)}
                  className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

