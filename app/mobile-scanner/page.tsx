'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';

// Sample flights data
const flights = [
  {
    flight: 'ET 302',
    date: '2024-01-15',
    aircraft: 'B787-9',
    route: { origin: 'ADD', intermediate: 'DUB', destination: 'JFK' },
    gate: 'Gate A12',
    depTime: '10:30',
    arrTime: '14:45',
    passengers: { total: 287, disembarking: 42, continuing: 245 },
    verification: { verified: 40, total: 42 },
    status: 'BOARDING',
    statusColor: 'bg-blue-100 text-blue-700'
  },
  {
    flight: 'ET 608',
    date: '2024-01-15',
    aircraft: 'B777-300ER',
    route: { origin: 'ADD', intermediate: 'FCO', destination: 'IAD' },
    gate: 'Gate B8',
    depTime: '11:15',
    arrTime: '15:30',
    passengers: { total: 312, disembarking: 67, continuing: 245 },
    verification: { verified: 67, total: 67 },
    status: 'IN FLIGHT',
    statusColor: 'bg-purple-100 text-purple-700'
  },
  {
    flight: 'ET 500',
    date: '2024-01-15',
    aircraft: 'B787-8',
    route: { origin: 'ADD', intermediate: 'CAI', destination: 'BRU' },
    gate: 'Gate C15',
    depTime: '09:45',
    arrTime: '13:20',
    passengers: { total: 198, disembarking: 23, continuing: 175 },
    verification: { verified: 21, total: 23 },
    status: 'ARRIVED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 701',
    date: '2024-01-15',
    aircraft: 'B787-9',
    route: { origin: 'ADD', intermediate: 'LHR', destination: 'LAX' },
    gate: 'Gate A5',
    depTime: '08:00',
    arrTime: '18:30',
    passengers: { total: 298, disembarking: 55, continuing: 243 },
    verification: { verified: 32, total: 55 },
    status: 'BOARDING',
    statusColor: 'bg-blue-100 text-blue-700'
  },
  {
    flight: 'ET 205',
    date: '2024-01-15',
    aircraft: 'B777-200LR',
    route: { origin: 'ADD', intermediate: 'DXB', destination: 'SYD' },
    gate: 'Gate B12',
    depTime: '13:20',
    arrTime: '06:45+1',
    passengers: { total: 342, disembarking: 78, continuing: 264 },
    verification: { verified: 45, total: 78 },
    status: 'BOARDING',
    statusColor: 'bg-blue-100 text-blue-700'
  },
  {
    flight: 'ET 404',
    date: '2024-01-15',
    aircraft: 'B787-8',
    route: { origin: 'ADD', intermediate: 'IST', destination: 'CDG' },
    gate: 'Gate C8',
    depTime: '16:45',
    arrTime: '22:10',
    passengers: { total: 234, disembarking: 38, continuing: 196 },
    verification: { verified: 38, total: 38 },
    status: 'IN FLIGHT',
    statusColor: 'bg-purple-100 text-purple-700'
  },
  {
    flight: 'ET 850',
    date: '2024-01-16',
    aircraft: 'B787-9',
    route: { origin: 'ADD', intermediate: 'DUB', destination: 'JFK' },
    gate: 'Gate A12',
    depTime: '10:30',
    arrTime: '14:45',
    passengers: { total: 287, disembarking: 42, continuing: 245 },
    verification: { verified: 0, total: 42 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 612',
    date: '2024-01-16',
    aircraft: 'B777-300ER',
    route: { origin: 'ADD', intermediate: 'FCO', destination: 'IAD' },
    gate: 'Gate B8',
    depTime: '11:15',
    arrTime: '15:30',
    passengers: { total: 312, disembarking: 67, continuing: 245 },
    verification: { verified: 0, total: 67 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 320',
    date: '2024-01-16',
    aircraft: 'B787-8',
    route: { origin: 'ADD', intermediate: 'CAI', destination: 'BRU' },
    gate: 'Gate C15',
    depTime: '09:45',
    arrTime: '13:20',
    passengers: { total: 198, disembarking: 23, continuing: 175 },
    verification: { verified: 0, total: 23 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 150',
    date: '2024-01-16',
    aircraft: 'B787-9',
    route: { origin: 'ADD', intermediate: 'LHR', destination: 'LAX' },
    gate: 'Gate A5',
    depTime: '08:00',
    arrTime: '18:30',
    passengers: { total: 298, disembarking: 55, continuing: 243 },
    verification: { verified: 0, total: 55 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 888',
    date: '2024-01-17',
    aircraft: 'B777-300ER',
    route: { origin: 'ADD', intermediate: 'DXB', destination: 'SYD' },
    gate: 'Gate B12',
    depTime: '13:20',
    arrTime: '06:45+1',
    passengers: { total: 342, disembarking: 78, continuing: 264 },
    verification: { verified: 0, total: 78 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 245',
    date: '2024-01-17',
    aircraft: 'B787-8',
    route: { origin: 'ADD', intermediate: 'IST', destination: 'CDG' },
    gate: 'Gate C8',
    depTime: '16:45',
    arrTime: '22:10',
    passengers: { total: 234, disembarking: 38, continuing: 196 },
    verification: { verified: 0, total: 38 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 302',
    date: '2025-12-29',
    aircraft: 'B787-9',
    route: { origin: 'ADD', intermediate: 'DUB', destination: 'JFK' },
    gate: 'Gate A12',
    depTime: '10:30',
    arrTime: '14:45',
    passengers: { total: 287, disembarking: 42, continuing: 245 },
    verification: { verified: 0, total: 42 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 608',
    date: '2025-12-29',
    aircraft: 'B777-300ER',
    route: { origin: 'ADD', intermediate: 'FCO', destination: 'IAD' },
    gate: 'Gate B8',
    depTime: '11:15',
    arrTime: '15:30',
    passengers: { total: 312, disembarking: 67, continuing: 245 },
    verification: { verified: 0, total: 67 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 500',
    date: '2025-12-29',
    aircraft: 'B787-8',
    route: { origin: 'ADD', intermediate: 'CAI', destination: 'BRU' },
    gate: 'Gate C15',
    depTime: '09:45',
    arrTime: '13:20',
    passengers: { total: 198, disembarking: 23, continuing: 175 },
    verification: { verified: 0, total: 23 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 701',
    date: '2025-12-29',
    aircraft: 'B787-9',
    route: { origin: 'ADD', intermediate: 'LHR', destination: 'LAX' },
    gate: 'Gate A5',
    depTime: '08:00',
    arrTime: '18:30',
    passengers: { total: 298, disembarking: 55, continuing: 243 },
    verification: { verified: 0, total: 55 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 205',
    date: '2025-12-29',
    aircraft: 'B777-200LR',
    route: { origin: 'ADD', intermediate: 'DXB', destination: 'SYD' },
    gate: 'Gate B12',
    depTime: '13:20',
    arrTime: '06:45+1',
    passengers: { total: 342, disembarking: 78, continuing: 264 },
    verification: { verified: 0, total: 78 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  },
  {
    flight: 'ET 404',
    date: '2025-12-29',
    aircraft: 'B787-8',
    route: { origin: 'ADD', intermediate: 'IST', destination: 'CDG' },
    gate: 'Gate C8',
    depTime: '16:45',
    arrTime: '22:10',
    passengers: { total: 234, disembarking: 38, continuing: 196 },
    verification: { verified: 0, total: 38 },
    status: 'SCHEDULED',
    statusColor: 'bg-gray-100 text-gray-700'
  }
];

// Sample passengers data for verification
const getPassengersForFlight = (flightNumber: string, date: string) => {
  // Mock passenger data - in real app, this would come from API
  const passengers = {
    'ET 302': [
      { id: 1, name: 'ANDERSON/JAMES MR', seat: '23B', status: 'verified', scanTime: '14:32:15' },
      { id: 2, name: 'SMITH/JOHN MR', seat: '12A', status: 'pending', scanTime: null },
      { id: 3, name: 'WILLIAMS/MARY MS', seat: '15C', status: 'pending', scanTime: null },
      { id: 4, name: 'BROWN/ROBERT MR', seat: '8D', status: 'verified', scanTime: '14:28:42' },
      { id: 5, name: 'DAVIS/LISA MS', seat: '20F', status: 'pending', scanTime: null }
    ],
    'ET 608': [
      { id: 1, name: 'JOHNSON/MICHAEL MR', seat: '10A', status: 'verified', scanTime: '15:10:22' },
      { id: 2, name: 'GARCIA/MARIA MS', seat: '18B', status: 'verified', scanTime: '15:12:05' },
      { id: 3, name: 'MARTINEZ/CARLOS MR', seat: '5C', status: 'pending', scanTime: null }
    ],
    'ET 500': [
      { id: 1, name: 'TAYLOR/SARAH MS', seat: '14A', status: 'verified', scanTime: '13:45:30' },
      { id: 2, name: 'THOMAS/DAVID MR', seat: '7B', status: 'pending', scanTime: null }
    ],
    'ET 701': [
      { id: 1, name: 'WILSON/CHRIS MR', seat: '11A', status: 'verified', scanTime: '08:15:30' },
      { id: 2, name: 'MOORE/AMANDA MS', seat: '22B', status: 'verified', scanTime: '08:18:45' },
      { id: 3, name: 'JACKSON/STEVEN MR', seat: '9C', status: 'pending', scanTime: null },
      { id: 4, name: 'WHITE/EMILY MS', seat: '16D', status: 'pending', scanTime: null },
      { id: 5, name: 'HARRIS/MARK MR', seat: '25E', status: 'pending', scanTime: null }
    ],
    'ET 205': [
      { id: 1, name: 'MARTIN/JENNIFER MS', seat: '6A', status: 'verified', scanTime: '13:25:10' },
      { id: 2, name: 'THOMPSON/KEVIN MR', seat: '14B', status: 'verified', scanTime: '13:27:22' },
      { id: 3, name: 'GARCIA/ANNA MS', seat: '19C', status: 'pending', scanTime: null },
      { id: 4, name: 'MARTINEZ/PAUL MR', seat: '3D', status: 'pending', scanTime: null }
    ],
    'ET 404': [
      { id: 1, name: 'ROBINSON/LINDA MS', seat: '12A', status: 'verified', scanTime: '16:50:15' },
      { id: 2, name: 'CLARK/DANIEL MR', seat: '21B', status: 'verified', scanTime: '16:52:30' },
      { id: 3, name: 'LEWIS/NANCY MS', seat: '8C', status: 'verified', scanTime: '16:55:45' }
    ],
    'ET 850': [
      { id: 1, name: 'WALKER/GEORGE MR', seat: '15A', status: 'pending', scanTime: null },
      { id: 2, name: 'HALL/SUSAN MS', seat: '24B', status: 'pending', scanTime: null },
      { id: 3, name: 'ALLEN/RICHARD MR', seat: '7C', status: 'pending', scanTime: null },
      { id: 4, name: 'YOUNG/KAREN MS', seat: '18D', status: 'pending', scanTime: null }
    ],
    'ET 612': [
      { id: 1, name: 'KING/JOSEPH MR', seat: '10A', status: 'pending', scanTime: null },
      { id: 2, name: 'WRIGHT/BETTY MS', seat: '20B', status: 'pending', scanTime: null },
      { id: 3, name: 'LOPEZ/FRANK MR', seat: '5C', status: 'pending', scanTime: null }
    ],
    'ET 320': [
      { id: 1, name: 'HILL/HENRY MR', seat: '13A', status: 'pending', scanTime: null },
      { id: 2, name: 'SCOTT/DOROTHY MS', seat: '17B', status: 'pending', scanTime: null }
    ],
    'ET 150': [
      { id: 1, name: 'GREEN/RAYMOND MR', seat: '11A', status: 'pending', scanTime: null },
      { id: 2, name: 'ADAMS/HELEN MS', seat: '23B', status: 'pending', scanTime: null },
      { id: 3, name: 'BAKER/LAWRENCE MR', seat: '9C', status: 'pending', scanTime: null }
    ],
    'ET 888': [
      { id: 1, name: 'NELSON/ALICE MS', seat: '14A', status: 'pending', scanTime: null },
      { id: 2, name: 'CARTER/CHARLES MR', seat: '22B', status: 'pending', scanTime: null },
      { id: 3, name: 'MITCHELL/RUTH MS', seat: '6C', status: 'pending', scanTime: null }
    ],
    'ET 245': [
      { id: 1, name: 'PEREZ/JAMES MR', seat: '16A', status: 'pending', scanTime: null },
      { id: 2, name: 'ROBERTS/VIOLET MS', seat: '19B', status: 'pending', scanTime: null }
    ]
  };
  return passengers[flightNumber as keyof typeof passengers] || [];
};

type ViewMode = 'flight-selection' | 'camera';

export default function MobileScanner() {
  const [selectedFlight, setSelectedFlight] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<ViewMode>('flight-selection');
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get available flight numbers for the selected date
  const availableFlights = flights.filter(f => f.date === selectedDate);

  // Check camera permission status
  const checkCameraPermission = async () => {
    try {
      // Check if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const permissionState = result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
          setCameraPermission(permissionState);
          
          // Listen for permission changes
          result.onchange = () => {
            const newState = result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt';
            setCameraPermission(newState);
            if (newState === 'granted') {
              setShowPermissionPrompt(false);
            }
          };
        } catch (permError) {
          // Permissions API might not support camera permission in all browsers
          setCameraPermission('prompt');
        }
      } else {
        // Fallback: assume prompt if Permissions API not available
        setCameraPermission('prompt');
      }
    } catch (error) {
      // Permissions API might not support camera permission
      setCameraPermission('prompt');
    }
  };

  // Check permission when component mounts
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Handle flight selection - go directly to camera
  const handleFlightSelect = () => {
    if (selectedFlight) {
      const flightPassengers = getPassengersForFlight(selectedFlight, selectedDate);
      setPassengers(flightPassengers);
      setCurrentView('camera');
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        alert('Camera access requires HTTPS. Please access this site using https:// or use localhost for development.');
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser. Please use a modern browser.');
      }

      // Request camera with better error handling
      // Use simpler constraints for better mobile compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera on mobile
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        setIsScanning(true);
        setCameraPermission('granted');
        setShowPermissionPrompt(false);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      // Handle permission denied - show UI instead of alert
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setShowPermissionPrompt(true);
        return;
      }
      
      let errorMessage = 'Unable to access camera.\n\n';
      
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another application.\n\n';
        errorMessage += 'Please close other apps using the camera and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera does not support required settings.\n\n';
        errorMessage += 'Trying with default settings...';
        // Retry with minimal constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            setIsScanning(true);
            setCameraPermission('granted');
            setShowPermissionPrompt(false);
          }
          return;
        } catch (retryError) {
          errorMessage = 'Camera access failed. Please try again.';
        }
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access requires HTTPS.\n\n';
        errorMessage += 'Please access this site using https:// (secure connection).';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your browser permissions and try again.\n\n';
        errorMessage += 'Make sure you\'re using HTTPS or localhost.';
      }
      
      alert(errorMessage);
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    setShowPermissionPrompt(false);
    await startCamera();
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Handle scan success (mock - in real app, this would process QR code)
  const handleScanSuccess = () => {
    // Find next pending passenger to verify (in real app, this would come from QR code scan)
    const nextPendingPassenger = passengers.find(p => p.status === 'pending');
    
    if (nextPendingPassenger) {
      const scanTime = new Date().toLocaleTimeString();
      
      // Simulate successful scan
      setScanResult({
        success: true,
        passenger: nextPendingPassenger,
        flight: selectedFlight,
        scanTime: scanTime
      });
      
      // Update passenger status
      setPassengers(prev => prev.map(p => 
        p.id === nextPendingPassenger.id 
          ? { ...p, status: 'verified', scanTime: scanTime }
          : p
      ));

      // Stop camera after 2 seconds and continue scanning
      setTimeout(() => {
        setScanResult(null);
        // Camera continues running for next scan
      }, 2000);
    } else {
      // All passengers verified
      setScanResult({
        success: true,
        passenger: null,
        flight: selectedFlight,
        scanTime: new Date().toLocaleTimeString(),
        message: 'All passengers verified!'
      });
      
      setTimeout(() => {
        stopCamera();
        setCurrentView('flight-selection');
        setSelectedFlight('');
        setPassengers([]);
        setScanResult(null);
      }, 2000);
    }
  };

  // Start camera automatically when camera view opens, and cleanup on exit
  useEffect(() => {
    if (currentView === 'camera') {
      if (cameraPermission === 'granted' && !isScanning && !streamRef.current) {
        startCamera();
      } else if (cameraPermission === 'denied' || cameraPermission === 'prompt') {
        setShowPermissionPrompt(true);
      }
    }
    
    return () => {
      if (currentView !== 'camera') {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, cameraPermission]);

  // Get selected flight details
  const flightDetails = flights.find(f => f.flight === selectedFlight);

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col">
      <Header activeTab="mobile-scanner" />
      
      <main className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl p-4 sm:p-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Flight Selection View */}
          {currentView === 'flight-selection' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Select Flight</h2>
                
                {/* Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Flight Number Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Number
                  </label>
                  <select
                    value={selectedFlight}
                    onChange={(e) => setSelectedFlight(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a flight</option>
                    {availableFlights.map((flight) => (
                      <option key={flight.flight} value={flight.flight}>
                        {flight.flight} - {flight.route.origin} → {flight.route.intermediate} → {flight.route.destination}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flight Details Preview */}
                {selectedFlight && flightDetails && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{flightDetails.flight}</h3>
                        <p className="text-sm text-gray-600">
                          {flightDetails.route.origin} → <span className="text-yellow-600 font-semibold">{flightDetails.route.intermediate}</span> → {flightDetails.route.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Gate: {flightDetails.gate}</p>
                      <p>Departure: {flightDetails.depTime} | Arrival: {flightDetails.arrTime}</p>
                      <p>Disembarking: {flightDetails.passengers.disembarking} passengers</p>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  onClick={handleFlightSelect}
                  disabled={!selectedFlight}
                  className="w-full bg-blue-600 text-white rounded-full py-3 sm:py-4 flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation"
                >
                  Start Scanning
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* Camera View */}
          {currentView === 'camera' && flightDetails && (
            <>
              {/* Permission Prompt Overlay */}
              {showPermissionPrompt && cameraPermission !== 'granted' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Camera Permission Required</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {cameraPermission === 'denied' 
                          ? 'Camera access was denied. Please allow camera access in your browser settings to continue scanning.'
                          : 'We need access to your camera to scan boarding passes. Please allow camera access when prompted.'}
                      </p>
                      {cameraPermission === 'denied' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
                          <p className="text-xs text-gray-700 font-semibold mb-1">To enable camera access:</p>
                          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                            <li>Click the camera icon in your browser's address bar</li>
                            <li>Select "Allow" for camera access</li>
                            <li>Refresh the page or click "Try Again" below</li>
                          </ol>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowPermissionPrompt(false);
                          setCurrentView('flight-selection');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={requestCameraPermission}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {cameraPermission === 'denied' ? 'Try Again' : 'Allow Camera'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Back Button */}
              <button
                onClick={() => {
                  stopCamera();
                  setCurrentView('flight-selection');
                  setSelectedFlight('');
                  setPassengers([]);
                  setScanResult(null);
                  setShowPermissionPrompt(false);
                }}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Flight Selection
              </button>

              {/* Flight Info Header */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Flight {flightDetails.flight}</h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {flightDetails.route.origin} → <span className="text-yellow-600 font-semibold">{flightDetails.route.intermediate}</span> → {flightDetails.route.destination}
                    </p>
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium self-start sm:self-auto">
                    Online
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Verification Progress</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {passengers.filter(p => p.status === 'verified').length}/{passengers.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${passengers.length > 0 ? (passengers.filter(p => p.status === 'verified').length / passengers.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Camera Scanner Frame */}
              <div className="relative mb-4 sm:mb-6">
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-square flex items-center justify-center relative min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
                  {isScanning ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Corner markers - white brackets */}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 sm:border-t-4 border-l-2 sm:border-l-4 border-white rounded-tl-lg"></div>
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 sm:border-t-4 border-r-2 sm:border-r-4 border-white rounded-tr-lg"></div>
                      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 sm:border-b-4 border-l-2 sm:border-l-4 border-white rounded-bl-lg"></div>
                      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 sm:border-b-4 border-r-2 sm:border-r-4 border-white rounded-br-lg"></div>
                      
                      {/* Scanning overlay - hidden when scanning */}
                      {!scanResult && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-white text-center opacity-0">
                            <p className="text-lg font-semibold mb-2">Scanning...</p>
                            <p className="text-sm opacity-75">Position QR code within frame</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-white text-center p-8">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm opacity-75">Position boarding pass in frame</p>
                    </div>
                  )}

                  {/* Success overlay */}
                  {scanResult && scanResult.success && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto">
                          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-xl font-bold">Verified!</p>
                        {scanResult.passenger && (
                          <p className="text-sm mt-2">{scanResult.passenger.name}</p>
                        )}
                        {scanResult.message && (
                          <p className="text-sm mt-2">{scanResult.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Floating Scan Button */}
                {!scanResult && (
                  <button
                    onClick={() => {
                      if (!isScanning) {
                        startCamera();
                      } else {
                        handleScanSuccess();
                      }
                    }}
                    className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-10 touch-manipulation"
                  >
                    {isScanning ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-600 space-y-1 mb-6 mt-8">
                <p>Tap the scan button to {isScanning ? 'verify boarding pass' : 'open camera'}</p>
                <p>Works offline - syncs automatically when online</p>
              </div>

              {/* Recent Scans */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Scans</h3>
                  <span className="text-sm text-gray-600">
                    {passengers.filter(p => p.status === 'verified').length} verified
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {passengers
                    .filter(p => p.status === 'verified')
                    .sort((a, b) => {
                      // Sort by scanTime, most recent first
                      if (!a.scanTime && !b.scanTime) return 0;
                      if (!a.scanTime) return 1;
                      if (!b.scanTime) return -1;
                      return b.scanTime.localeCompare(a.scanTime);
                    })
                    .slice(0, 3)
                    .map((passenger) => (
                      <div key={passenger.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            OFF
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{passenger.name}</p>
                            <p className="text-xs text-gray-500">Seat {passenger.seat} • {passenger.scanTime || 'Just now'}</p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    ))}
                </div>
                
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {passengers.filter(p => p.status === 'verified').length} Verified
                    </span>
                    <span className="text-sm text-gray-600">
                      {passengers.filter(p => p.status === 'pending').length} Pending
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {passengers.length > 0 ? Math.round((passengers.filter(p => p.status === 'verified').length / passengers.length) * 100) : 0}% Complete
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 sm:py-2 px-4 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation">
                    Sync Now
                  </button>
                  <button className="flex-1 bg-white text-gray-700 border border-gray-300 rounded-lg py-2.5 sm:py-2 px-4 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                    View Manifest
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
