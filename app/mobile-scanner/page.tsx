'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import { CameraEnhancer } from "dynamsoft-camera-enhancer";
import { BarcodeReader, TextResult } from "dynamsoft-javascript-barcode";
import type { PlayCallbackInfo } from "dynamsoft-camera-enhancer/dist/types/interface/playcallbackinfo";

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
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'warning' | 'info', message: string, details?: string}>>([]);
  
  const mounted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const enhancerRef = useRef<CameraEnhancer | null>(null);
  const codeReaderRef = useRef<BarcodeReader | null>(null);
  const scanningActiveRef = useRef<boolean>(false);
  const intervalRef = useRef<any>(null);
  const decodingRef = useRef<boolean>(false);
  
  // Initialize Dynamsoft BarcodeReader - same approach as NextJS-Barcode-Scanner
  useEffect(() => {
    const init = async () => {
      if (mounted.current === false) {
        try {
          const licenseKey = 'DLS2eyJoYW5kc2hha2VDb2RlIjoiMTA0OTkyMzAwLU1UQTBPVGt5TXpBd0xYZGxZaTFVY21saGJGQnliMm8iLCJtYWluU2VydmVyVVJMIjoiaHR0cHM6Ly9tZGxzLmR5bmFtc29mdG9ubGluZS5jb20iLCJvcmdhbml6YXRpb25JRCI6IjEwNDk5MjMwMCIsInN0YW5kYnlTZXJ2ZXJVUkwiOiJodHRwczovL3NkbHMuZHluYW1zb2Z0b25saW5lLmNvbSIsImNoZWNrQ29kZSI6MTYwOTU4NzI4OH0=';
          
          // Set license BEFORE createInstance - exactly like NextJS-Barcode-Scanner
          // CRITICAL: License must be set BEFORE createInstance or loadWasm
          // Check if WASM is not loaded - if it is, license should already be set
          if (BarcodeReader.isWasmLoaded() === false) {
            // Set license and engine path BEFORE any createInstance call
            BarcodeReader.license = licenseKey;
            BarcodeReader.engineResourcePath = "@"; // Use local node_modules like NextJS-Barcode-Scanner
            console.log('License and engine path set');
          } else {
            // WASM already loaded - license should be set, but ensure engine path is set
            if (!BarcodeReader.engineResourcePath || BarcodeReader.engineResourcePath !== "@") {
              BarcodeReader.engineResourcePath = "@";
            }
            console.log('WASM already loaded, skipping license set');
          }
          
          // Only create instance if we don't already have one
          // This ensures license is set before createInstance
          if (!codeReaderRef.current) {
            // Initialize BarcodeReader AFTER license is set
            codeReaderRef.current = await BarcodeReader.createInstance();
            
            // Configure to prioritize PDF417 (boarding pass format)
            try {
              const settings = await codeReaderRef.current.getRuntimeSettings();
              const { EnumBarcodeFormat } = await import('dynamsoft-javascript-barcode');
              
              if (EnumBarcodeFormat) {
                settings.barcodeFormatIds = EnumBarcodeFormat.BF_PDF417 | 
                                            EnumBarcodeFormat.BF_QR_CODE | 
                                            EnumBarcodeFormat.BF_DATAMATRIX | 
                                            EnumBarcodeFormat.BF_AZTEC;
              }
              
              // PDF417 settings may not be in type definition but can be set
              if ((settings as any).pdf417Settings) {
                (settings as any).pdf417Settings = (settings as any).pdf417Settings || {};
                if ((settings as any).pdf417Settings.scanStep !== undefined) {
                  (settings as any).pdf417Settings.scanStep = 2;
                }
              }
              
              if (settings.expectedBarcodesCount !== undefined) {
                settings.expectedBarcodesCount = 1;
              }
              
              await codeReaderRef.current.updateRuntimeSettings(settings);
              console.log('Barcode reader configured for PDF417');
            } catch (configError) {
              console.warn('Could not configure barcode reader settings:', configError);
            }
          }
          
          console.log('Dynamsoft SDK loaded');
        } catch (error) {
          console.error('Error loading Dynamsoft SDK:', error);
          addNotification('error', 'Initialization error', error instanceof Error ? error.message : 'Failed to initialize scanner');
        }
      }
      mounted.current = true;
    };
    
    init();
  }, []);

  // Initialize CameraEnhancer when container is available (when camera view is shown)
  useEffect(() => {
    const initCameraEnhancer = async () => {
      // Only initialize if we're in camera view and container is available
      if (currentView === 'camera' && containerRef.current && !enhancerRef.current) {
        try {
          enhancerRef.current = await CameraEnhancer.createInstance();
          await enhancerRef.current.setUIElement(containerRef.current);
          enhancerRef.current.setVideoFit("cover");
          
          enhancerRef.current.on("played", (playCallbackInfo: PlayCallbackInfo) => {
            setIsScanning(true);
            setCameraPermission('granted');
            setShowPermissionPrompt(false);
            startBoardingPassScanning();
          });
          
          enhancerRef.current.on("cameraClose", () => {
            setIsScanning(false);
          });
          
          console.log('CameraEnhancer initialized');
        } catch (error) {
          console.error('Error initializing CameraEnhancer:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          addNotification('error', 'Camera initialization error', `Failed to initialize camera: ${errorMessage}`);
        }
      }
    };
    
    // Small delay to ensure container is rendered
    const timer = setTimeout(() => {
      initCameraEnhancer();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentView]); // Re-run when view changes to camera

  // Add notification
  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string, details?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message, details }]);
    
    // Auto-remove after 5 seconds for success/info, 8 seconds for error/warning
    const timeout = type === 'error' || type === 'warning' ? 8000 : 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, timeout);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
              // If we're in camera view and camera isn't running, start it automatically
              if (currentView === 'camera' && !isScanning && !enhancerRef.current) {
                startCamera();
              }
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

  // Start camera - using CameraEnhancer like NextJS-Barcode-Scanner
  const startCamera = async () => {
    try {
      // Wait for CameraEnhancer to be initialized if not ready
      if (!enhancerRef.current) {
        if (!containerRef.current) {
          addNotification('error', 'Camera not ready', 'Please wait for camera to initialize');
          return;
        }
        
        // Try to initialize if container is ready
        enhancerRef.current = await CameraEnhancer.createInstance();
        await enhancerRef.current.setUIElement(containerRef.current);
        enhancerRef.current.setVideoFit("cover");
        
        enhancerRef.current.on("played", (playCallbackInfo: PlayCallbackInfo) => {
          setIsScanning(true);
          setCameraPermission('granted');
          setShowPermissionPrompt(false);
          startBoardingPassScanning();
        });
        
        enhancerRef.current.on("cameraClose", () => {
          setIsScanning(false);
        });
      }
      
      // Open camera
      if (enhancerRef.current) {
        await enhancerRef.current.open(true);
      } else {
        throw new Error('CameraEnhancer not initialized');
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      // Provide more detailed error information
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.error('Camera error details:', {
        name: error?.name,
        message: errorMessage,
        stack: error?.stack
      });
      
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setShowPermissionPrompt(true);
      } else {
        addNotification('error', 'Camera error', `Failed to start camera: ${errorMessage}`);
      }
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    setShowPermissionPrompt(false);
    await startCamera();
  };

  // Start scanning boarding pass barcodes - using CameraEnhancer like NextJS-Barcode-Scanner
  const startBoardingPassScanning = () => {
    if (!codeReaderRef.current || !enhancerRef.current) {
      console.log('Cannot start scanning - missing reader or enhancer');
      return;
    }
    
    if (scanningActiveRef.current) {
      console.log('Scanning already active');
      return;
    }
    
    scanningActiveRef.current = true;
    addNotification('info', 'Scanning started', 'Looking for boarding pass barcodes...');
    
    // Start scanning loop - same approach as NextJS-Barcode-Scanner
    const startScanning = () => {
      const decode = async () => {
        if (decodingRef.current === false && codeReaderRef.current && enhancerRef.current) {
          decodingRef.current = true;
          try {
            // Use enhancer.getFrame() - same as NextJS-Barcode-Scanner
            const results = await codeReaderRef.current.decode(enhancerRef.current.getFrame());
            
            if (results && Array.isArray(results) && results.length > 0) {
              const barcodeText = results[0].barcodeText;
              if (barcodeText) {
                scanningActiveRef.current = false;
                stopScanning();
                handleBoardingPassDetected(barcodeText);
                return;
              }
            }
          } catch (error) {
            // Ignore "no barcode found" errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('No barcode') && !errorMessage.includes('not found')) {
              console.error('Decode error:', error);
            }
          }
          decodingRef.current = false;
        }
      };
      
      // Use 40ms interval like NextJS-Barcode-Scanner
      intervalRef.current = setInterval(decode, 40);
    };
    
    startScanning();
  };
  
  // Stop scanning
  const stopScanning = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    scanningActiveRef.current = false;
  };

  // Parse boarding pass barcode data (IATA format)
  const parseBoardingPass = (barcodeText: string) => {
    // Boarding pass barcodes typically follow IATA format
    // Format: M1LASTNAME/FIRSTNAME MIDDLE E1234567890 1A 15F 0123 1234567890123 1
    // Or simpler formats with encoded data
    
    const parsed: any = {
      raw: barcodeText,
      passengerName: '',
      flightNumber: '',
      date: '',
      seat: '',
      pnr: '',
      class: '',
      sequence: '',
      airline: '',
      parseErrors: [] as string[]
    };
    
    try {
      // Try to parse IATA format
      // Common pattern: Name/First E1234567890 Flight Seat Date PNR
      const parts = barcodeText.split(' ');
      
      // Look for name pattern (LASTNAME/FIRSTNAME)
      const nameMatch = barcodeText.match(/([A-Z]+\/[A-Z]+)/);
      if (nameMatch) {
        const nameParts = nameMatch[1].split('/');
        parsed.passengerName = `${nameParts[1]} ${nameParts[0]}`;
      }
      
      // Look for flight number pattern (e.g., EK123, AA456)
      const flightMatch = barcodeText.match(/([A-Z]{2,3}\d{3,4})/);
      if (flightMatch) {
        parsed.flightNumber = flightMatch[1];
        parsed.airline = flightMatch[1].substring(0, 2);
      }
      
      // Look for seat pattern (e.g., 15F, 32A)
      const seatMatch = barcodeText.match(/(\d{1,2}[A-Z])/);
      if (seatMatch) {
        parsed.seat = seatMatch[1];
      }
      
      // Look for date pattern (YYMMDD or MMDDYY)
      const dateMatch = barcodeText.match(/(\d{6})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        // Try to parse as YYMMDD
        if (dateStr.length === 6) {
          const year = '20' + dateStr.substring(0, 2);
          const month = dateStr.substring(2, 4);
          const day = dateStr.substring(4, 6);
          parsed.date = `${year}-${month}-${day}`;
        }
      }
      
      // Look for PNR (6 alphanumeric characters)
      const pnrMatch = barcodeText.match(/([A-Z0-9]{6})/);
      if (pnrMatch && pnrMatch[1].length === 6) {
        parsed.pnr = pnrMatch[1];
      }
      
      // If we can't parse structured data, try to extract any readable info
      if (!parsed.passengerName && !parsed.flightNumber) {
        // Try to find any text that looks like a name or flight
        const textParts = barcodeText.split(/[\s\/]+/);
        textParts.forEach((part: string) => {
          if (part.length > 2 && part.length < 20 && /^[A-Z]+$/.test(part)) {
            if (!parsed.passengerName) {
              parsed.passengerName = part;
            }
          }
        });
      }
      
      // Check if we successfully parsed any meaningful data
      const hasData = parsed.passengerName || parsed.flightNumber || parsed.seat || parsed.pnr;
      if (!hasData) {
        parsed.parseErrors.push('Could not extract passenger name, flight number, seat, or PNR from barcode');
      }
      
    } catch (error: any) {
      console.error('Error parsing boarding pass:', error);
      parsed.parseErrors.push(`Parsing error: ${error.message || 'Unknown error'}`);
    }
    
    return parsed;
  };

  // Handle detected boarding pass barcode
  const handleBoardingPassDetected = (barcodeText: string) => {
    // Scanning is already stopped when barcode is detected
    
    // Show notification that barcode was detected
    addNotification('success', 'Barcode detected!', `Raw data: ${barcodeText.substring(0, 50)}${barcodeText.length > 50 ? '...' : ''}`);
    
    // Parse boarding pass data from barcode
    const boardingPassData = parseBoardingPass(barcodeText);
    const scanTime = new Date().toLocaleTimeString();
    
    // Check for parsing errors
    if (boardingPassData.parseErrors && boardingPassData.parseErrors.length > 0) {
      const errorDetails = boardingPassData.parseErrors.join('; ');
      addNotification(
        'error', 
        'Failed to parse boarding pass data', 
        `Barcode was detected but parsing failed. Reasons: ${errorDetails}. Raw barcode: ${barcodeText}`
      );
    } else {
      // Check if we got meaningful data
      const hasData = boardingPassData.passengerName || boardingPassData.flightNumber || boardingPassData.seat;
      if (!hasData) {
        addNotification(
          'warning',
          'Limited data extracted',
          `Barcode detected but could not extract passenger name, flight number, or seat. Raw data: ${barcodeText}`
        );
      } else {
        addNotification('success', 'Boarding pass parsed successfully', 
          `Extracted: ${boardingPassData.passengerName ? 'Name: ' + boardingPassData.passengerName + ', ' : ''}${boardingPassData.flightNumber ? 'Flight: ' + boardingPassData.flightNumber + ', ' : ''}${boardingPassData.seat ? 'Seat: ' + boardingPassData.seat : ''}`
        );
      }
    }
    
    // Try to find matching passenger in the list
    const passenger = findPassengerFromBarcode(barcodeText);
    
    if (passenger) {
      if (passenger.status === 'verified') {
        addNotification('warning', 'Passenger already verified', `${passenger.name} (Seat ${passenger.seat}) was already verified`);
      } else {
        addNotification('success', 'Passenger matched', `Found matching passenger: ${passenger.name} (Seat ${passenger.seat})`);
      }
    } else {
      addNotification('warning', 'Passenger not found', 'Barcode detected but passenger not found in flight manifest');
    }
    
    // Display the scanned boarding pass details
    setScanResult({
      success: true,
      boardingPass: boardingPassData,
      passenger: passenger || null,
      flight: selectedFlight,
      scanTime: scanTime,
      barcodeText: barcodeText
    });
    
    // If we found a matching passenger, update their status
    if (passenger && passenger.status === 'pending') {
      setPassengers(prev => prev.map(p => 
        p.id === passenger.id 
          ? { ...p, status: 'verified', scanTime: scanTime }
          : p
      ));
    }
    
    // Resume scanning after 3 seconds (longer to read the details)
    setTimeout(() => {
      setScanResult(null);
      if (enhancerRef.current && isScanning) {
        addNotification('info', 'Resuming scan...', 'Ready to scan next boarding pass');
        startBoardingPassScanning();
      }
    }, 3000);
  };

  // Helper function to find passenger from barcode data
  const findPassengerFromBarcode = (barcodeText: string): any => {
    // Boarding pass barcodes contain encoded data
    // For demo, we'll try simple matching
    // In production, you'd parse the barcode according to airline format (IATA, etc.)
    
    // Try matching by passenger ID, seat, or name fragments
    const passenger = passengers.find(p => {
      // Try exact ID match
      if (barcodeText.includes(p.id)) return true;
      
      // Try seat match (e.g., "32L" in barcode)
      if (barcodeText.includes(p.seat)) return true;
      
      // Try name fragments (boarding passes often contain name parts)
      const nameParts = p.name.split('/').map((part: string) => part.trim().toUpperCase());
      if (nameParts.some((part: string) => part.length > 2 && barcodeText.toUpperCase().includes(part))) {
        return true;
      }
      
      // Try flight number match (if barcode contains flight info)
      if (selectedFlight && barcodeText.includes(selectedFlight.replace(/\s/g, ''))) {
        // If flight matches, try to match by other criteria
        return barcodeText.includes(p.seat) || barcodeText.includes(p.id);
      }
      
      return false;
    });
    
    return passenger;
  };

  // Capture and scan from image (fallback method) - using CameraEnhancer
  const captureAndScan = async () => {
    if (!codeReaderRef.current || !enhancerRef.current) {
      addNotification('error', 'Camera not ready', 'Please ensure camera is started before capturing');
      return;
    }
    
    // Temporarily stop continuous scanning while capturing
    const wasScanning = scanningActiveRef.current;
    stopScanning();
    
    try {
      addNotification('info', 'Capturing...', 'Analyzing captured image for PDF417 barcode...');
      
      // Use enhancer.getFrame() - same as NextJS-Barcode-Scanner
      const results = await codeReaderRef.current.decode(enhancerRef.current.getFrame());
      
      if (results && Array.isArray(results) && results.length > 0) {
        const barcodeText = results[0].barcodeText;
        if (barcodeText) {
          console.log('Barcode detected from capture:', barcodeText);
          handleBoardingPassDetected(barcodeText);
          return;
        }
      }
      
      addNotification('warning', 'No barcode found', 'Could not detect a barcode in the captured image. Please try again.');
      // Resume continuous scanning if it was active
      if (wasScanning && enhancerRef.current) {
        setTimeout(() => {
          startBoardingPassScanning();
        }, 500);
      }
    } catch (error) {
      console.error('Error capturing and scanning:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('No barcode') || errorMessage.includes('not found')) {
        addNotification('warning', 'No barcode found', 'Could not detect a barcode in the captured image. Please ensure the boarding pass is clearly visible and try again.');
      } else {
        addNotification('error', 'Scan failed', `Error while scanning captured image: ${errorMessage}`);
      }
      // Resume continuous scanning if it was active
      if (wasScanning && enhancerRef.current) {
        setTimeout(() => {
          startBoardingPassScanning();
        }, 500);
      }
    }
  };

  // Stop camera - using CameraEnhancer like NextJS-Barcode-Scanner
  const stopCamera = () => {
    stopScanning();
    if (enhancerRef.current) {
      enhancerRef.current.close();
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
      // Always try to start camera when entering camera view
      if (!isScanning && !enhancerRef.current) {
        startCamera().catch(() => {
          // If camera fails to start, show permission prompt if needed
          if (cameraPermission === 'denied' || cameraPermission === 'prompt') {
            setShowPermissionPrompt(true);
          }
        });
      }
    }
    
    return () => {
      if (currentView !== 'camera') {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // Get selected flight details
  const flightDetails = flights.find(f => f.flight === selectedFlight);

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col">
      <Header activeTab="mobile-scanner" />
      
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full sm:max-w-md">
        {notifications.map((notification) => {
          const bgColor = 
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500';
          
          const icon = 
            notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : notification.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : notification.type === 'warning' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
          
          return (
            <div
              key={notification.id}
              className={`${bgColor} text-white rounded-lg shadow-lg p-4 animate-slide-in-right flex items-start gap-3`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{notification.message}</p>
                {notification.details && (
                  <p className="text-xs mt-1 opacity-90 break-words">{notification.details}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      
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

              {/* Camera Scanner Frame - using CameraEnhancer like NextJS-Barcode-Scanner */}
              <div className="relative mb-4 sm:mb-6">
                <div 
                  ref={containerRef}
                  className="bg-gray-900 rounded-lg overflow-hidden aspect-square flex items-center justify-center relative min-h-[250px] sm:min-h-[300px] md:min-h-[400px]"
                  style={{ position: "relative", width: "100%", height: "100%" }}
                >
                  {/* CameraEnhancer will inject video here */}
                  <div className="dce-video-container"></div>
                  
                  {/* Corner markers - white brackets */}
                  {isScanning && (
                    <>
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 sm:border-t-4 border-l-2 sm:border-l-4 border-white rounded-tl-lg z-10"></div>
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-t-2 sm:border-t-4 border-r-2 sm:border-r-4 border-white rounded-tr-lg z-10"></div>
                      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 sm:border-b-4 border-l-2 sm:border-l-4 border-white rounded-bl-lg z-10"></div>
                      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-12 sm:h-12 border-b-2 sm:border-b-4 border-r-2 sm:border-r-4 border-white rounded-br-lg z-10"></div>
                      
                      {/* Scanning indicator */}
                      {!scanResult && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            Scanning...
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Placeholder when camera is off */}
                  {!isScanning && (
                    <div className="text-white text-center p-8 z-10">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm opacity-75">Position boarding pass in frame</p>
                    </div>
                  )}

                  {/* Success overlay - Show boarding pass details */}
                  {scanResult && scanResult.success && scanResult.boardingPass && (
                    <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-20 overflow-y-auto">
                      <div className="w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-6">Boarding Pass Scanned</p>
                        
                        {/* Boarding Pass Details */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left space-y-3">
                          {scanResult.boardingPass.passengerName && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Passenger Name</p>
                              <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.passengerName}</p>
                            </div>
                          )}
                          
                          {scanResult.boardingPass.flightNumber && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Flight Number</p>
                              <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.flightNumber}</p>
                            </div>
                          )}
                          
                          {scanResult.boardingPass.seat && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Seat</p>
                              <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.seat}</p>
                            </div>
                          )}
                          
                          {scanResult.boardingPass.date && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Date</p>
                              <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.date}</p>
                            </div>
                          )}
                          
                          {scanResult.boardingPass.pnr && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">PNR</p>
                              <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.pnr}</p>
                            </div>
                          )}
                          
                          {scanResult.boardingPass.airline && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Airline</p>
                              <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.airline}</p>
                            </div>
                          )}
                          
                          {/* Show raw barcode if no structured data found */}
                          {!scanResult.boardingPass.passengerName && !scanResult.boardingPass.flightNumber && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-2">Barcode Data</p>
                              <p className="text-xs font-mono text-gray-700 break-all bg-white p-2 rounded border">
                                {scanResult.barcodeText || scanResult.boardingPass.raw}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Matched Passenger Info */}
                        {scanResult.passenger && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-xs text-blue-600 uppercase mb-1">Matched Passenger</p>
                            <p className="text-sm font-semibold text-blue-900">{scanResult.passenger.name}</p>
                            <p className="text-xs text-blue-700">Seat {scanResult.passenger.seat}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-4">Scanning will resume automatically...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Floating Camera Button - Only to start camera */}
                {!isScanning && !scanResult && (
                  <button
                    onClick={() => {
                      startCamera();
                    }}
                    className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-10 touch-manipulation"
                    title="Start Camera"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                
                {/* Capture & Scan Button - Fallback when camera is active */}
                {isScanning && !scanResult && (
                  <button
                    onClick={captureAndScan}
                    className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:bg-green-700 active:bg-green-800 transition-colors z-10 touch-manipulation border-4 border-white"
                    title="Capture & Scan"
                  >
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>

              
              {/* Instructions */}
              <div className="text-center text-sm text-gray-600 space-y-1 mb-4 mt-8">
                <p>{isScanning ? 'Point camera at boarding pass barcode - scanning automatically, or tap the green button to capture & scan' : 'Tap the camera button to start scanning'}</p>
                <p>Works offline - syncs automatically when online</p>
              </div>
              
              {/* Reset Scanning Button - appears if scanning is stuck */}
              {isScanning && scanningActiveRef.current && (
                <div className="text-center mb-4">
                  <button
                    onClick={() => {
                      console.log('Manual reset of scanning');
                      scanningActiveRef.current = false;
                      addNotification('info', 'Scanning reset', 'Resetting scanner. Please wait...');
                      setTimeout(() => {
                        if (enhancerRef.current && codeReaderRef.current) {
                          startBoardingPassScanning();
                        }
                      }, 1000);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Reset Scanner
                  </button>
                </div>
              )}

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
