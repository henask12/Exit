'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { NotificationContainer } from '../components/ui/NotificationToast';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { FlightSelection } from './components/FlightSelection';
import { CameraView } from './components/CameraView';
import { useCamera } from './hooks/useCamera';
import { useFlightData } from './hooks/useFlightData';
import { useScanning } from './hooks/useScanning';
import { usePassengerMatching } from './hooks/usePassengerMatching';
import { auth } from '@/lib/auth';

type ViewMode = 'flight-selection' | 'camera';

export default function MobileScanner() {
  const router = useRouter();
  const { isChecking, user } = useAuth();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const [currentView, setCurrentView] = useState<ViewMode>('flight-selection');
  const [station, setStation] = useState<string>('');
  const [showRemainingPassengers, setShowRemainingPassengers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const camera = useCamera();
  const flightData = useFlightData(station);
  const scanning = useScanning();
  const passengerMatching = usePassengerMatching(flightData.flightDetails);

  // Get station from user on mount
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    const userData = auth.getUser();
    if (userData && userData.station) {
      setStation(userData.station.code);
    } else if (user && user.station) {
      // Fallback to useAuth user if available
      setStation(user.station.code);
    }
  }, [router, user]);

  // Reset scanned passengers when flight changes
  useEffect(() => {
    if (flightData.flightDetails) {
      passengerMatching.resetScannedPassengers();
    }
  }, [flightData.flightDetails, passengerMatching]);

  // Auto-start camera when switching to camera view
  useEffect(() => {
    if (currentView === 'camera' && !camera.isScanning) {
      // Small delay to ensure video element is mounted
      const timer = setTimeout(() => {
        camera.startCamera().catch((error) => {
          console.error('Failed to start camera:', error);
          const errorMessage = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
            ? 'Camera permission denied. Please allow camera access in your browser settings.'
            : error.message || 'Failed to start camera. Please check permissions.';
          addNotification('error', 'Camera Error', errorMessage);
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentView, camera.isScanning, camera.startCamera, addNotification]);

  // Handle flight selection
  const handleFlightSelect = useCallback(async () => {
    // Get station from user if not set in state
    const currentStation = station || user?.station?.code || '';
    
    if (!currentStation) {
      addNotification('error', 'Station Missing', 'Station information is not available. Please refresh the page.');
      return;
    }
    
    if (!flightData.flightNumber) {
      addNotification('error', 'Flight Number Missing', 'Please select a flight number.');
      return;
    }
    
    if (!flightData.flightDate) {
      addNotification('error', 'Flight Date Missing', 'Please select a flight date.');
      return;
    }
    
    try {
      await flightData.fetchFlightDetails(currentStation, flightData.flightNumber, flightData.flightDate);
      setCurrentView('camera');
    } catch (error: any) {
      console.error('Error in handleFlightSelect:', error);
      addNotification('error', 'Failed to load flight', error.message || 'Could not fetch flight details');
    }
  }, [station, user, flightData, addNotification]);

  // Handle image capture and scan
  const handleCaptureAndScan = useCallback(async () => {
    try {
      const imageBlob = await camera.captureFrame();
      const scanResult = await scanning.scanImage(imageBlob);
      
      if (scanResult && flightData.flightDetails) {
        const matchResult = passengerMatching.matchPassenger(scanResult);
        if (matchResult.matched && matchResult.matchKey) {
          passengerMatching.addScannedPassenger(matchResult.matchKey);
          addNotification('success', 'Passenger matched!', `Matched: ${matchResult.passenger?.passengerName || scanResult.passengerName}`);
        } else {
          addNotification('warning', 'Passenger not in manifest', `Scanned: ${scanResult.passengerName || 'Unknown'}`);
        }
      }
    } catch (error: any) {
      console.error('Capture and scan error:', error);
      addNotification('error', 'Scan failed', error.message || 'Failed to capture and scan');
    }
  }, [camera, scanning, passengerMatching, flightData.flightDetails, addNotification]);

  // Handle native camera capture
  const handleNativeCameraCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    try {
      const imageBlob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: file.type }));
      const scanResult = await scanning.scanImage(imageBlob);
      
      if (scanResult && flightData.flightDetails) {
        const matchResult = passengerMatching.matchPassenger(scanResult);
        if (matchResult.matched && matchResult.matchKey) {
          passengerMatching.addScannedPassenger(matchResult.matchKey);
          addNotification('success', 'Passenger matched!', `Matched: ${matchResult.passenger?.passengerName || scanResult.passengerName}`);
        } else {
          addNotification('warning', 'Passenger not in manifest', `Scanned: ${scanResult.passengerName || 'Unknown'}`);
        }
      }
    } catch (error: any) {
      console.error('Native camera capture error:', error);
      addNotification('error', 'Processing failed', error.message || 'Failed to process image');
    }
  }, [scanning, passengerMatching, flightData.flightDetails, addNotification]);

  // Continuous scanning
  useEffect(() => {
    if (currentView === 'camera' && camera.isScanning && flightData.flightDetails) {
      const interval = setInterval(() => {
        if (!scanning.isLoading) {
          handleCaptureAndScan();
        }
      }, 3000); // Scan every 3 seconds

      return () => clearInterval(interval);
    }
  }, [currentView, camera.isScanning, flightData.flightDetails, scanning.isLoading, handleCaptureAndScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      camera.stopCamera();
    };
  }, [camera]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e3a5f]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col">
      <Header activeTab="mobile-scanner" />
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      <main className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl p-4 sm:p-6">
          {/* Flight Selection View */}
          {currentView === 'flight-selection' && (
            <FlightSelection
              station={station}
              flightDate={flightData.flightDate}
              flightNumber={flightData.flightNumber}
              flightNumbers={flightData.flightNumbers}
              isLoadingFlights={flightData.isLoadingFlights}
              onDateChange={(date) => {
                flightData.setFlightDate(date);
                flightData.setFlightNumber('');
              }}
              onFlightNumberChange={flightData.setFlightNumber}
              onStartScanning={handleFlightSelect}
            />
          )}

          {/* Camera View */}
          {currentView === 'camera' && (
            <>
              <CameraView
                videoRef={camera.videoRef}
                station={station}
                flightDetails={flightData.flightDetails}
                scannedPassengers={passengerMatching.scannedPassengers}
                showRemainingPassengers={showRemainingPassengers}
                onToggleRemainingPassengers={() => setShowRemainingPassengers(!showRemainingPassengers)}
                scanStatus={scanning.scanStatus}
                recentScans={scanning.recentScans}
                onRemoveScan={scanning.removeScan}
              />
              
              {/* Hidden file input for native camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleNativeCameraCapture}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
