'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { createWorker } from 'tesseract.js';
import { apiCall } from '@/lib/auth';
import { auth } from '@/lib/auth';

type ViewMode = 'flight-selection' | 'camera';

export default function MobileScanner() {
  const [currentView, setCurrentView] = useState<ViewMode>('flight-selection');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<Array<any>>([]);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string, type: 'success' | 'error' | 'warning' | 'info', message: string, details?: string }>>([]);
  const [apiConnectionError, setApiConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [station, setStation] = useState<string>('GVA');
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [flightDate, setFlightDate] = useState<string>('');
  const [flightNumbers, setFlightNumbers] = useState<Array<number>>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [flightDetails, setFlightDetails] = useState<any>(null);
  const [scannedPassengers, setScannedPassengers] = useState<Set<string>>(new Set());
  const [showRemainingPassengers, setShowRemainingPassengers] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityScanTypeFilter, setActivityScanTypeFilter] = useState<string>('all');
  const [flightProgress, setFlightProgress] = useState<any>(null);

  // Calculate scans in the last 5 minutes
  const scansInLast5Minutes = useMemo(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return recentScans.filter((scan: any) => {
      const scanTime = scan.scannedAt ? new Date(scan.scannedAt) : (scan.timestamp ? new Date(scan.timestamp) : null);
      return scanTime && scanTime >= fiveMinutesAgo;
    }).length;
  }, [recentScans]);

  // Get logged-in user's station
  const userStation = useMemo(() => {
    const user = auth.getUser();
    return user?.station?.code || station || 'N/A';
  }, [station]);

  // Format route from API (e.g., "ADD-GVA-MAN" to "ADD → GVA → MAN")
  const formattedRoute = useMemo(() => {
    if (flightDetails?.route) {
      return flightDetails.route.split('-').join(' → ');
    }
    return 'N/A';
  }, [flightDetails?.route]);

  // Fetch flight progress
  const fetchFlightProgress = useCallback(async () => {
    if (!flightNumber || !flightDate || !station) return;
    
    try {
      const dateStr = flightDate.split('T')[0]; // Get YYYY-MM-DD format
      const response = await apiCall(`/Flight/progress?flightNumber=${flightNumber}&date=${dateStr}&station=${station}`);
      if (response.ok) {
        const progress = await response.json();
        setFlightProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching flight progress:', error);
    }
  }, [flightNumber, flightDate, station]);

  // Manually match a passenger (when boarding pass is not found)
  const handleManualMatch = async (passenger: any) => {
    if (!passenger || !passenger.id) return;

    try {
      setIsLoading(true);
      
      // Call API to mark passenger as scanned
      const response = await apiCall('/Flight/scan-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passengerId: passenger.id,
          station: userStation || station,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark passenger as scanned');
      }

      const matchKey = `${passenger.pnrLocator || ''}_${passenger.seat || ''}`.toUpperCase();
      
      // Add to scanned passengers
      setScannedPassengers(prev => new Set([...prev, matchKey]));

      // Create a scan record for manual match
      const scanData = {
        id: Date.now().toString(),
        success: true,
        source: 'manual',
        boardingPass: {
          passengerName: passenger.passengerName || passenger.name,
          seat: passenger.seat,
          pnr: passenger.pnrLocator
        },
        scanTime: new Date().toLocaleTimeString(),
        scanDate: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        scannedAt: new Date().toISOString(),
        matched: true,
        matchedPassenger: passenger,
        passengerName: passenger.passengerName || passenger.name,
        pnrLocator: passenger.pnrLocator,
        scanType: 'manual'
      };

      // Add to recent scans
      setRecentScans(prev => [scanData, ...prev]);

      // Refresh flight progress and flight details to get updated scan status
      await fetchFlightProgress();
      
      // Refresh flight details to get updated scan status
      if (flightNumber && flightDate && station) {
        try {
          const dateStr = flightDate.split('T')[0];
          const detailsResponse = await apiCall(`/Flight/details?flightNumber=${flightNumber}&date=${dateStr}&station=${station}`);
          if (detailsResponse.ok) {
            const updatedDetails = await detailsResponse.json();
            setFlightDetails(updatedDetails);
          }
        } catch (error) {
          console.error('Error refreshing flight details:', error);
        }
      }

      addNotification('success', 'Passenger manually matched', `${passenger.passengerName || passenger.name} has been marked as scanned`);
    } catch (error: any) {
      addNotification('error', 'Manual Match Failed', error.message || 'Failed to mark passenger as scanned');
    } finally {
      setIsLoading(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningActiveRef = useRef<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const selectedDeviceIdRef = useRef<string | undefined>(undefined);
  const ocrFallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const apiScanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize ZXing BarcodeReader with support for 2D barcodes and PDF417
  // Note: PDF417 requires BigInt support in the browser (available in modern browsers)
  // BrowserMultiFormatReader supports all formats by default, including PDF417 and 2D barcodes
  useEffect(() => {
    const initZXing = async () => {
      if (!codeReaderRef.current) {
        // BrowserMultiFormatReader supports all formats by default including:
        // - 2D: QR Code, Data Matrix, Aztec, PDF417
        // - 1D: CODE_128, CODE_39, EAN, UPC, ITF, CODABAR
        // Using default constructor ensures all readers are properly initialized
        codeReaderRef.current = new BrowserMultiFormatReader();
        console.log('ZXing barcode reader initialized - supports all formats including PDF417 and 2D barcodes');

        // List available video devices and select the first one (prefer back camera)
        // Note: listVideoInputDevices is an instance method (works in runtime, types may be wrong)
        try {
          const videoInputDevices = await (codeReaderRef.current as any).listVideoInputDevices();
          if (videoInputDevices.length > 0) {
            // Prefer back camera (environment facing)
            const backCamera = videoInputDevices.find((device: any) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            selectedDeviceIdRef.current = backCamera?.deviceId || videoInputDevices[0].deviceId;
            console.log('Selected camera device:', selectedDeviceIdRef.current);
          }
        } catch (err) {
          console.warn('Could not list video devices:', err);
        }
      }
    };

    initZXing();

    return () => {
      // Cleanup on unmount
      if (apiScanIntervalRef.current) {
        clearInterval(apiScanIntervalRef.current);
        apiScanIntervalRef.current = null;
      }

      if (ocrFallbackTimerRef.current) {
        clearTimeout(ocrFallbackTimerRef.current);
        ocrFallbackTimerRef.current = null;
      }

      if (codeReaderRef.current) {
        try {
          (codeReaderRef.current as any).reset();
        } catch (e) {
          // Ignore cleanup errors
        }
        codeReaderRef.current = null;
      }
    };
  }, []);

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
              if (currentView === 'camera' && !isScanning && !streamRef.current) {
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

  // Auto-start camera on mount or when switching to camera view
  useEffect(() => {
    if (currentView === 'camera' && !isScanning && !streamRef.current) {
      const permission = cameraPermission;
      if (permission === 'prompt' || permission === 'granted' || permission === 'checking') {
        setTimeout(() => {
          startCamera().catch(() => {
            if (permission === 'prompt') {
              setShowPermissionPrompt(true);
            }
          });
        }, 500);
      }
    }
  }, [cameraPermission, currentView]);

  // Start camera - get camera stream and assign to video element
  const startCamera = async () => {
    try {
      if (!videoRef.current) {
        addNotification('error', 'Camera not ready', 'Video element not available');
        return;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        alert('Camera access requires HTTPS. Please access this site using https:// or use localhost for development.');
        return;
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Ensure video element is properly configured
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      // Get camera stream
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Assign stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          const onLoadedMetadata = () => {
            videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoRef.current?.play().then(() => {
              resolve();
            }).catch(reject);
          };

          videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);

          // Timeout after 5 seconds
          setTimeout(() => {
            videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
            reject(new Error('Video stream timeout'));
          }, 5000);
        });
      }

      setIsScanning(true);
      // addNotification('success', 'Camera started', 'Camera is ready. Tap the capture button to scan.');

    } catch (error: any) {
      console.error('Error starting camera:', error);
      setIsScanning(false);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setShowPermissionPrompt(true);
        addNotification('error', 'Camera permission denied', 'Please allow camera access to scan boarding passes');
      } else {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        addNotification('error', 'Camera error', `Failed to start camera: ${errorMessage}`);
      }
    }
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    setShowPermissionPrompt(false);
    await startCamera();
  };

  // Start scanning boarding pass barcodes - using API
  const startBoardingPassScanning = () => {
    if (!videoRef.current) {
      console.log('Cannot start scanning - missing video element');
      return;
    }

    if (scanningActiveRef.current) {
      console.log('Scanning already active');
      return;
    }

    scanningActiveRef.current = true;
    addNotification('info', 'Scanning started', 'Looking for boarding pass barcodes...');

    // Periodically capture frames and send to API
    const scanInterval = setInterval(async () => {
      if (!scanningActiveRef.current || !videoRef.current || isProcessingScanRef.current || scanResult) {
        return;
      }

      // Check if video is ready
      if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        return;
      }

      isProcessingScanRef.current = true;

      try {
        // Create canvas to capture current frame
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          isProcessingScanRef.current = false;
          return;
        }

        // Draw current video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          isProcessingScanRef.current = false;

          if (!blob || !scanningActiveRef.current) {
            return;
          }

          try {
            setIsLoading(true);
            setScanStatus('loading');

            // Send to API
            const apiResult = await scanBoardingPassAPI(blob);

            if (apiResult.success && apiResult.decodedText && scanningActiveRef.current) {
              console.log('API scan result:', apiResult);
              setScanStatus('success');
              const scanType = apiResult.scanType || 'Barcode';
              const decodedText = apiResult.decodedText;

              // Stop scanning
              scanningActiveRef.current = false;
              if (apiScanIntervalRef.current) {
                clearInterval(apiScanIntervalRef.current);
                apiScanIntervalRef.current = null;
              }

              // Parse the decoded text
              const boardingPassData = parseBoardingPass(decodedText);

              // Create scan result
              const scanData = {
                id: Date.now().toString(),
                success: true,
                source: scanType,
                boardingPass: boardingPassData,
                scanTime: new Date().toLocaleTimeString(),
                scanDate: new Date().toLocaleDateString(),
                barcodeText: decodedText,
                barcodeFormat: apiResult.barcodeFormat,
                ocrConfidence: apiResult.ocrConfidence,
                timestamp: new Date().toISOString()
              };

              // Add to recent scans (save all scans, no limit)
              setRecentScans(prev => [scanData, ...prev]);

              // Display result
              setScanResult(scanData);

              addNotification('success', `${scanType} scan successful!`, `Detected: ${boardingPassData.passengerName || boardingPassData.flightNumber || 'Boarding pass'}`);

              // Resume scanning after 3 seconds
              setTimeout(() => {
                setScanResult(null);
                setScanStatus(null);
                if (streamRef.current && isScanning && videoRef.current) {
                  addNotification('info', 'Resuming scan...', 'Ready to scan next boarding pass');
                  startBoardingPassScanning();
                }
              }, 3000);
            } else {
              setScanStatus('error');
              setTimeout(() => {
                setScanStatus(null);
              }, 2000);
            }
          } catch (apiError: any) {
            setScanStatus('error');

            // Handle API errors gracefully during continuous scanning
            const errorMessage = apiError?.message || 'Unknown error';

            // Only show notification for connection errors (not for normal "no barcode found" cases)
            if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network error')) {
              // Show error notification only once, not on every failed attempt
              if (!apiConnectionError || apiConnectionError !== errorMessage) {
                console.error('API connection error:', apiError);
                // Don't spam notifications - only log
              }
            } else {
              // Other errors (like "no barcode found") are normal during scanning
              console.log('API scan attempt failed (normal during continuous scanning):', apiError);
            }

            setTimeout(() => {
              setScanStatus(null);
            }, 2000);
          } finally {
            setIsLoading(false);
          }
        }, 'image/jpeg', 0.9);

      } catch (error) {
        isProcessingScanRef.current = false;
        console.error('Error capturing frame:', error);
      }
    }, 1000); // Scan every 2 seconds

    apiScanIntervalRef.current = scanInterval;
  };

  // Stop scanning
  const stopScanning = () => {
    scanningActiveRef.current = false;

    // Clear API scan interval
    if (apiScanIntervalRef.current) {
      clearInterval(apiScanIntervalRef.current);
      apiScanIntervalRef.current = null;
    }

    // Clear OCR fallback timer
    if (ocrFallbackTimerRef.current) {
      clearTimeout(ocrFallbackTimerRef.current);
      ocrFallbackTimerRef.current = null;
    }

    isProcessingScanRef.current = false;

    if (codeReaderRef.current) {
      try {
        (codeReaderRef.current as any).reset();
      } catch (e) {
        // Ignore reset errors
      }
    }
  };

  // OCR helper function to extract text from boarding pass images
  const performOCR = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    try {
      addNotification('info', 'OCR Processing', 'Extracting text from boarding pass...');

      const worker = await createWorker('eng'); // English language
      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();

      if (text && text.trim().length > 0) {
        console.log('OCR extracted raw text:', text);
        console.log('OCR text length:', text.length);
        return text.trim();
      }

      return null;
    } catch (error) {
      console.error('OCR error:', error);
      addNotification('error', 'OCR Failed', 'Could not extract text from image');
      return null;
    }
  };

  // Extract boarding pass data from OCR text
  const extractBoardingPassFromOCR = (ocrText: string): any => {
    const extracted: any = {
      raw: ocrText,
      passengerName: '',
      flightNumber: '',
      date: '',
      seat: '',
      pnr: '',
      class: '',
      sequence: '',
      airline: '',
      source: 'OCR'
    };

    // Normalize text - remove extra spaces and newlines
    const normalizedText = ocrText.replace(/\s+/g, ' ').toUpperCase();

    // Extract passenger name - look for pattern LASTNAME/FIRSTNAME MS/MR
    // Ethiopian Airlines format: SAMUEL/ALERU MS
    const namePattern = /([A-Z]{2,}\/[A-Z]{2,}(?:\s+[A-Z]+)?(?:\s+(?:MS|MR|MRS|MISS))?)/;
    const nameMatch = normalizedText.match(namePattern);
    if (nameMatch) {
      const namePart = nameMatch[1].trim();
      // Remove title if present
      const nameWithoutTitle = namePart.replace(/\s+(MS|MR|MRS|MISS)$/, '');
      if (nameWithoutTitle.includes('/')) {
        const [last, first] = nameWithoutTitle.split('/');
        extracted.passengerName = `${first.trim()} ${last.trim()}`;
      } else {
        extracted.passengerName = nameWithoutTitle;
      }
    }

    // Extract flight number - Ethiopian Airlines format: ET938, ET706
    // Look for pattern ET followed by 3-4 digits, avoid matching random text
    const flightPatterns = [
      /(?:FLIGHT|FLT)[:\s]*([A-Z]{2}\d{3,4})/i, // After "FLIGHT" label
      /\b(ET\d{3,4})\b/, // ET followed by 3-4 digits as word boundary
      /\b([A-Z]{2}\d{3,4})\b/ // Any 2-letter airline code + 3-4 digits
    ];

    for (const pattern of flightPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const flight = match[1].replace(/\s+/g, '');
        // Validate it's a real flight number (not random text)
        if (flight.length >= 5 && flight.length <= 6 && /^[A-Z]{2}\d{3,4}$/.test(flight)) {
          extracted.flightNumber = flight;
          extracted.airline = flight.substring(0, 2);
          break;
        }
      }
    }

    // Extract seat - look for pattern after "SEAT" label or standalone pattern
    // Format: 11A, 21A (1-2 digits + 1 letter)
    const seatPatterns = [
      /(?:SEAT|ST)[:\s]*(\d{1,2}[A-Z])/i, // After "SEAT" label
      /\b(\d{1,2}[A-Z])\b/ // Standalone seat pattern
    ];

    for (const pattern of seatPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const seat = match[1];
        // Validate seat (1-2 digits + 1 letter, not part of flight number)
        if (/^\d{1,2}[A-Z]$/.test(seat) && !seat.match(/^\d{3,4}[A-Z]$/)) {
          extracted.seat = seat;
          break;
        }
      }
    }

    // Extract date - Ethiopian Airlines format: 10DEC
    const datePatterns = [
      /(\d{1,2}[A-Z]{3}\d{0,2})/, // 10DEC or 10DEC24
      /(\d{2}[A-Z]{3}\d{2})/, // 10DEC24
      /(\d{1,2}[A-Z]{3})/ // 10DEC
    ];

    for (const pattern of datePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        extracted.date = match[1];
        break;
      }
    }

    // Extract PNR/Booking Code - 6 alphanumeric characters
    // Look for "BOOKING CODE" or "PNR" label, or standalone 6-char code
    const pnrPatterns = [
      /(?:BOOKING\s+CODE|PNR|BOOKING)[:\s]*([A-Z0-9]{6})/i,
      /\b([A-Z0-9]{6})\b/ // Standalone 6-character code
    ];

    for (const pattern of pnrPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const pnr = match[1];
        // Validate it's not a flight number or date
        if (!pnr.match(/^[A-Z]{2}\d{4}$/) && !pnr.match(/^\d{6}$/)) {
          extracted.pnr = pnr;
          break;
        }
      }
    }

    // Extract class - look for Y, J, F, C after "CLASS" label
    const classPatterns = [
      /(?:CLASS)[:\s]*([YJFC])/i,
      /\b([YJFC])\b/ // Standalone class code
    ];

    for (const pattern of classPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        extracted.class = match[1];
        break;
      }
    }

    // Log extracted data for debugging
    console.log('OCR Extraction Results:', {
      passengerName: extracted.passengerName,
      flightNumber: extracted.flightNumber,
      seat: extracted.seat,
      pnr: extracted.pnr,
      date: extracted.date,
      class: extracted.class
    });

    return extracted;
  };

  // Parse boarding pass barcode data (IATA BCBP format)
  const parseBoardingPass = (barcodeText: string) => {
    // IATA BCBP (Bar Coded Boarding Pass) format
    // Example: M2SAMUEL/ALERU MS     ESLPQOZ NDJADDET 0938 344Y011A0001...
    // Format structure: M[format code][name] [PNR] [origin][dest][airline][flight] [date][class][seat][sequence]...

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
      origin: '',
      destination: '',
      parseErrors: [] as string[]
    };

    try {
      // Remove format code (M1, M2, etc.) if present
      let text = barcodeText.replace(/^M[0-9]/, '');

      // Extract passenger name - format: LASTNAME/FIRSTNAME MS/MR
      // Example: SAMUEL/ALERU MS
      const nameMatch = text.match(/([A-Z]{2,}\/[A-Z]{2,}(?:\s+[A-Z]+)?(?:\s+(?:MS|MR|MRS|MISS))?)/);
      if (nameMatch) {
        const namePart = nameMatch[1].trim();
        const nameWithoutTitle = namePart.replace(/\s+(MS|MR|MRS|MISS)$/, '');
        if (nameWithoutTitle.includes('/')) {
          const [last, first] = nameWithoutTitle.split('/');
          parsed.passengerName = `${first.trim()} ${last.trim()}`;
        } else {
          parsed.passengerName = nameWithoutTitle;
        }
        // Remove name from text for further parsing
        text = text.substring(nameMatch.index! + nameMatch[0].length).trim();
      }

      // Extract PNR (Booking Code) - 6 alphanumeric characters
      // Usually appears early in the string after name, may have E prefix
      // Example from API: ESLPQOZ or SLPQOZ
      const pnrPatterns = [
        /E([A-Z0-9]{6})\s/, // E prefix followed by 6 chars and space (like ESLPQOZ )
        /\b([A-Z]{6})\b/, // Any 6-char uppercase letters (like SLPQOZ)
        /\b([A-Z0-9]{6})\b/, // Any 6-char alphanumeric
      ];

      for (const pattern of pnrPatterns) {
        const pnrMatch = text.match(pattern);
        if (pnrMatch) {
          const pnr = pnrMatch[1];
          // Validate it's not a flight number pattern and is valid PNR format
          if (!pnr.match(/^[A-Z]{2}\d{4}$/) && pnr.length === 6 && /^[A-Z0-9]+$/.test(pnr)) {
            parsed.pnr = pnr;
            break;
          }
        }
      }

      // Extract flight segments - format: [origin][dest][airline][flight] [date][class][seat][sequence]
      // Example from API: NDJADDET 0938 344Y011A0001
      // Or: ADDFRAET 0706 345Y021A0001
      // Pattern: 3-letter origin, 3-letter dest, 2-letter airline, space, 3-4 digit flight, space, 3-digit julian date, class, seat (1-3 digits + letter), 4-digit sequence
      const flightSegmentPattern = /([A-Z]{3})([A-Z]{3})([A-Z]{2})\s+(\d{3,4})\s+(\d{3})([YJFC])(\d{1,3})([A-Z])(\d{4})/g;
      const flightSegments: any[] = [];
      let match;

      while ((match = flightSegmentPattern.exec(text)) !== null) {
        const segment = {
          origin: match[1],
          destination: match[2],
          airline: match[3],
          flightNumber: match[3] + match[4],
          date: match[5], // Julian date (day of year)
          class: match[6],
          seat: match[7] + match[8],
          sequence: match[9]
        };
        flightSegments.push(segment);
      }

      // Use first flight segment as primary
      if (flightSegments.length > 0) {
        const primary = flightSegments[0];
        parsed.flightNumber = primary.flightNumber;
        parsed.airline = primary.airline;
        parsed.seat = primary.seat;
        parsed.class = primary.class;
        parsed.sequence = primary.sequence;
        parsed.origin = primary.origin;
        parsed.destination = primary.destination;
        parsed.date = primary.date; // Julian date format

        // Convert Julian date to readable format if possible
        // Format: 344 = day 344 of year
        if (primary.date && primary.date.length === 3) {
          const dayOfYear = parseInt(primary.date);
          // Approximate conversion (would need year context for exact date)
          parsed.date = `Day ${dayOfYear}`;
        }
      }

      // If no structured flight segment found, try simpler patterns
      if (!parsed.flightNumber) {
        // Look for flight number pattern (e.g., ET938, ET706)
        const flightMatch = text.match(/\b([A-Z]{2})(\d{3,4})\b/);
        if (flightMatch) {
          parsed.flightNumber = flightMatch[1] + flightMatch[2];
          parsed.airline = flightMatch[1];
        }
      }

      if (!parsed.seat) {
        // Look for seat pattern (e.g., 11A, 21A)
        const seatMatch = text.match(/\b(\d{1,2})([A-Z])\b/);
        if (seatMatch) {
          parsed.seat = seatMatch[1] + seatMatch[2];
        }
      }

      // Check if we successfully parsed any meaningful data
      const hasData = parsed.passengerName || parsed.flightNumber || parsed.seat || parsed.pnr;
      if (!hasData) {
        parsed.parseErrors.push('Could not extract passenger name, flight number, seat, or PNR from barcode');
      }

      console.log('Parsed boarding pass data:', parsed);

    } catch (error: any) {
      console.error('Error parsing boarding pass:', error);
      parsed.parseErrors.push(`Parsing error: ${error.message || 'Unknown error'}`);
    }

    return parsed;
  };

  // Handle detected boarding pass barcode
  const handleBoardingPassDetected = (barcodeText: string, ocrData?: any) => {
    // Scanning is already stopped when barcode is detected

    // Determine source and show appropriate notification
    const source = ocrData ? 'OCR' : 'Barcode';
    if (ocrData) {
      addNotification('success', 'Text extracted via OCR!', `Extracted text from boarding pass image`);
    } else {
      addNotification('success', 'Barcode detected!', `Raw data: ${barcodeText.substring(0, 50)}${barcodeText.length > 50 ? '...' : ''}`);
    }

    // Parse boarding pass data - use OCR data if provided, otherwise parse from barcode
    const boardingPassData = ocrData || parseBoardingPass(barcodeText);
    const scanTime = new Date().toLocaleTimeString();
    const scanDate = new Date().toLocaleDateString();

    // Create scan result object
    const scanData = {
      id: Date.now().toString(),
      success: true,
      source: source,
      boardingPass: boardingPassData,
      scanTime: scanTime,
      scanDate: scanDate,
      barcodeText: barcodeText,
      timestamp: new Date().toISOString()
    };

    // Add to recent scans (most recent first, save all scans)
    setRecentScans(prev => [scanData, ...prev]);

    // Display the scanned boarding pass details
    setScanResult(scanData);

    // Resume scanning after 3 seconds
    setTimeout(() => {
      setScanResult(null);
      if (streamRef.current && isScanning && videoRef.current) {
        addNotification('info', 'Resuming scan...', 'Ready to scan next boarding pass');
        startBoardingPassScanning();
      }
    }, 3000);
  };


  // Get date options (today-1, today, today+1)
  const getDateOptions = () => {
    const today = new Date();
    const dates = [];
    for (let i = -1; i <= 1; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        label: i === 0 ? 'Today' : i === -1 ? 'Yesterday' : 'Tomorrow',
        value: date.toISOString().split('T')[0], // YYYY-MM-DD format
        date: date
      });
    }
    return dates;
  };

  // Fetch flight numbers from API
  const fetchFlightNumbers = async (station: string, flightDate: string) => {
    if (!station || !flightDate) return;

    try {
      setIsLoadingFlights(true);
      const apiUrl = `https://alphaapi-et-transitpax.azurewebsites.net/api/Flight/numbers?station=${station}&flightDate=${flightDate}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }

      const data = await response.json();
      // API returns array of numbers like [309, 318, 322, ...]
      let flights: number[] = [];
      if (Array.isArray(data)) {
        flights = data.map((item: any) => typeof item === 'number' ? item : Number(item));
      } else if (data.flights && Array.isArray(data.flights)) {
        flights = data.flights.map((item: any) => typeof item === 'number' ? item : Number(item));
      } else if (data.flightNumbers && Array.isArray(data.flightNumbers)) {
        flights = data.flightNumbers.map((item: any) => typeof item === 'number' ? item : Number(item));
      }
      setFlightNumbers(flights);
    } catch (error) {
      console.error('Error fetching flight numbers:', error);
      addNotification('error', 'Failed to load flights', 'Could not fetch flight numbers from API');
      setFlightNumbers([]);
    } finally {
      setIsLoadingFlights(false);
    }
  };

  // Handle flight selection and switch to camera view
  const handleFlightSelect = async () => {
    if (station && flightNumber && flightDate) {
      try {
        setIsLoadingFlights(true);
        // Call API to get flight details with scan status
        const dateStr = flightDate.split('T')[0]; // Get YYYY-MM-DD format
        const response = await apiCall(`/Flight/details?flightNumber=${flightNumber}&date=${dateStr}&station=${station}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch flight details: ${response.status}`);
        }

        const data = await response.json();

        // Store flight details
        setFlightDetails(data);
        // Reset scanned passengers when new flight is loaded
        setScannedPassengers(new Set());

        console.log('Flight details:', data);

        // Fetch flight progress
        try {
          const progressResponse = await apiCall(`/Flight/progress?flightNumber=${flightNumber}&date=${dateStr}&station=${station}`);
          if (progressResponse.ok) {
            const progress = await progressResponse.json();
            setFlightProgress(progress);
          }
        } catch (error) {
          console.error('Error fetching flight progress:', error);
        }

        // Switch to camera view
        setCurrentView('camera');
      } catch (error) {
        console.error('Error fetching flight details:', error);
        addNotification('error', 'Failed to load flight', 'Could not fetch flight details');
      } finally {
        setIsLoadingFlights(false);
      }
    }
  };

  // Effect to fetch flights when station and date change
  useEffect(() => {
    if (station && flightDate) {
      fetchFlightNumbers(station, flightDate);
    }
  }, [station, flightDate]);

  // Effect to fetch flight progress periodically when in camera view
  useEffect(() => {
    if (flightNumber && flightDate && station && currentView === 'camera') {
      fetchFlightProgress();
      const interval = setInterval(() => {
        fetchFlightProgress();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [flightNumber, flightDate, station, currentView, fetchFlightProgress]);

  // Send image to API for scanning
  const scanBoardingPassAPI = async (imageBlob: Blob): Promise<any> => {
    try {

      const formData = new FormData();
      formData.append('file', imageBlob, 'boarding-pass.jpg');

      const apiUrl = 'https://alphaapi-et-transitpax.azurewebsites.net/api/BoardingPass/scan';

      console.log('🌐 Making API request to:', apiUrl, {
        method: 'POST',
        imageSize: imageBlob.size,
        imageType: imageBlob.type,
        timestamp: new Date().toISOString()
      });


      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        // Note: CORS must be enabled on the API server
      });

      console.log('📡 API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      // Clear any previous connection errors on success
      setApiConnectionError(null);
      return data;
    } catch (error: any) {
      console.error('API scan error:', error);

      // Determine error type and set appropriate message
      let errorMessage = 'Unknown error';
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to API server. Please check:\n- API server is running\n- CORS is enabled on the API\n- Network connectivity';
        setApiConnectionError('Connection failed - API server may be unreachable');
      } else if (error.message && error.message.includes('NetworkError')) {
        errorMessage = 'Network error - please check your connection';
        setApiConnectionError('Network error');
      } else if (error.message) {
        errorMessage = error.message;
        setApiConnectionError(error.message);
      }

      // Re-throw with improved error message
      throw new Error(errorMessage);
    }
  };

  // Handle native camera capture
  const handleNativeCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      setIsLoading(true);
      setScanStatus('loading');

      // Convert file to blob
      const blob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: file.type }));

      // Send to API for scanning (don't save yet)
      const apiResult = await scanBoardingPassAPI(blob);

      if (apiResult.success && apiResult.decodedText) {
        setScanStatus('success');
        const scanType = apiResult.scanType || 'Barcode';
        const decodedText = apiResult.decodedText;

        // Parse the decoded text
        const boardingPassData = parseBoardingPass(decodedText);

        // Match with flight details
        const matchResult = matchPassenger(boardingPassData);

        // Create scan result
        const scanData = {
          id: Date.now().toString(),
          success: true,
          source: scanType,
          boardingPass: boardingPassData,
          scanTime: new Date().toLocaleTimeString(),
          scanDate: new Date().toLocaleDateString(),
          barcodeText: decodedText,
          barcodeFormat: apiResult.barcodeFormat,
          ocrConfidence: apiResult.ocrConfidence,
          timestamp: new Date().toISOString(),
          scannedAt: new Date().toISOString(), // Add scannedAt for consistency
          matched: matchResult.matched,
          matchedPassenger: matchResult.passenger
        };

        // If matched, add to scanned passengers
        if (matchResult.matched && matchResult.matchKey) {
          setScannedPassengers(prev => new Set([...prev, matchResult.matchKey!]));
        }

        // Add to recent scans (save all scans, no limit)
        setRecentScans(prev => [scanData, ...prev]);

        // Display result
        setScanResult(scanData);

        if (matchResult.matched) {
          addNotification('success', `${scanType} scan successful!`, `Matched: ${matchResult.passenger?.passengerName || boardingPassData.passengerName}`);
        } else {
          addNotification('warning', `${scanType} scan successful!`, `Not found in flight manifest: ${boardingPassData.passengerName || boardingPassData.flightNumber || 'Boarding pass'}`);
        }

        // Clear result after 2 seconds to be ready for next capture
        setTimeout(() => {
          setScanResult(null);
          setScanStatus(null);
          addNotification('info', 'Ready for next scan', 'Camera ready to capture again');
        }, 1000);
      } else {
        setScanStatus('error');
        addNotification('warning', 'Scan failed', apiResult.error || 'Could not decode boarding pass');
        setTimeout(() => {
          setScanStatus(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing native camera image:', error);
      setScanStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      addNotification('error', 'Processing failed', `Error: ${errorMessage}`);
      setTimeout(() => {
        setScanStatus(null);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Open native camera
  const openNativeCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Match scanned passenger with flight details
  const matchPassenger = (boardingPassData: any): { matched: boolean; passenger?: any; matchKey?: string } => {
    if (!flightDetails || !flightDetails.disembarkingPassengers) {
      return { matched: false };
    }

    const pnr = boardingPassData.pnr?.toUpperCase();
    const seat = boardingPassData.seat?.toUpperCase();
    const passengerName = boardingPassData.passengerName?.toUpperCase();

    // Try to match by PNR first, then seat, then name
    for (const passenger of flightDetails.disembarkingPassengers) {
      const matchKey = `${passenger.pnrLocator || ''}_${passenger.seat || ''}`.toUpperCase();

      if (pnr && passenger.pnrLocator?.toUpperCase() === pnr) {
        return { matched: true, passenger, matchKey };
      }
      if (seat && passenger.seat?.toUpperCase() === seat) {
        return { matched: true, passenger, matchKey };
      }
      if (passengerName && passenger.passengerName?.toUpperCase().includes(passengerName)) {
        return { matched: true, passenger, matchKey };
      }
    }

    return { matched: false };
  };

  // Capture and scan from image - using API
  const captureAndScan = async () => {
    if (!videoRef.current) {
      addNotification('error', 'Camera not ready', 'Video element not available');
      return;
    }

    // Check if video stream exists
    if (!streamRef.current) {
      addNotification('error', 'Camera not ready', 'Please start the camera first');
      return;
    }

    // Check if video has valid dimensions (allow some time for stream to initialize)
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        addNotification('error', 'Camera not ready', 'Camera stream not ready yet. Please wait a moment.');
        return;
      }
    }

    // Stop any active scanning
    stopScanning();

    try {
      // Create canvas to capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        addNotification('error', 'Capture failed', 'Could not create canvas context');
        return;
      }

      // Draw current video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          addNotification('error', 'Capture failed', 'Could not convert image to blob');
          return;
        }

        try {
          setIsLoading(true);
          setScanStatus('loading');

          // Send to API (don't save yet)
          console.log('📤 Sending image to API for scanning...', {
            blobSize: blob.size,
            blobType: blob.type,
            timestamp: new Date().toISOString()
          });

          const apiResult = await scanBoardingPassAPI(blob);

          console.log('📥 API response received:', {
            success: apiResult.success,
            hasDecodedText: !!apiResult.decodedText,
            scanType: apiResult.scanType,
            timestamp: new Date().toISOString()
          });

          if (apiResult.success && apiResult.decodedText) {
            console.log('API scan result:', apiResult);
            setScanStatus('success');
            const scanType = apiResult.scanType || 'Barcode';
            const decodedText = apiResult.decodedText;

            // Parse the decoded text
            const boardingPassData = parseBoardingPass(decodedText);

            // Match with flight details
            const matchResult = matchPassenger(boardingPassData);

            // Create scan result
            const scanData = {
              id: Date.now().toString(),
              success: true,
              source: scanType,
              boardingPass: boardingPassData,
              scanTime: new Date().toLocaleTimeString(),
              scanDate: new Date().toLocaleDateString(),
              barcodeText: decodedText,
              barcodeFormat: apiResult.barcodeFormat,
              ocrConfidence: apiResult.ocrConfidence,
              timestamp: new Date().toISOString(),
              matched: matchResult.matched,
              matchedPassenger: matchResult.passenger
            };

            // If matched, add to scanned passengers
            if (matchResult.matched && matchResult.matchKey) {
              setScannedPassengers(prev => new Set([...prev, matchResult.matchKey!]));
            }

            // Add to recent scans (save all scans, no limit)
            setRecentScans(prev => [scanData, ...prev]);

            // Display result
            setScanResult(scanData);

            if (matchResult.matched) {
              addNotification('success', `${scanType} scan successful!`, `Matched: ${matchResult.passenger?.passengerName || boardingPassData.passengerName}`);
            } else {
              addNotification('warning', `${scanType} scan successful!`, `Not found in flight manifest: ${boardingPassData.passengerName || boardingPassData.flightNumber || 'Boarding pass'}`);
            }

            // Clear result after 2 seconds to be ready for next capture
            setTimeout(() => {
              setScanResult(null);
              setScanStatus(null);
              // Resume camera scanning if still active
              // if (streamRef.current && isScanning && videoRef.current) {
              //   addNotification('info', 'Ready for next scan', 'Camera ready to capture again');
              // }
            }, 2000);
          } else {
            setScanStatus('error');
            addNotification('warning', 'Scan failed', apiResult.error || 'Could not decode boarding pass');
            // Still ready for next capture even on failure
            setTimeout(() => {
              setScanStatus(null);
              // if (streamRef.current && isScanning && videoRef.current) {
              //   addNotification('info', 'Ready for next scan', 'Camera ready to capture again');
              // }
            }, 2000);
          }
        } catch (apiError) {
          console.error('API scan error:', apiError);
          setScanStatus('error');
          const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
          addNotification('error', 'API Error', `Failed to scan: ${errorMessage}`);
          // Still ready for next capture even on error
          setTimeout(() => {
            setScanStatus(null);
            // if (streamRef.current && isScanning && videoRef.current) {
            //   addNotification('info', 'Ready for next scan', 'Camera ready to capture again');
            // }
          }, 2000);
        } finally {
          setIsLoading(false);
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Error capturing and scanning:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      addNotification('error', 'Capture failed', `Error while processing image: ${errorMessage}`);
    }
  };

  // Stop camera - using ZXing
  const stopCamera = () => {
    stopScanning();
    if (codeReaderRef.current) {
      try {
        (codeReaderRef.current as any).reset();
      } catch (e) {
        // Ignore reset errors
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };


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

      <main className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8 bg-white">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 border-shadow-2xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl p-4 sm:p-6">
          {/* Flight Selection View */}
          {currentView === 'flight-selection' && (
            <div className="flex flex-col items-center justify-center min-h-[500px] py-8">
              <div className="w-full max-w-md space-y-6">
                {/* Header with Icon */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#00A651] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Flight</h2>
                  <p className="text-sm text-gray-600">Choose your flight date and flight number below to initiate the passenger scanning process.</p>
                </div>

                {/* Active Station Badge */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 bg-green-100 text-[#00A651] px-4 py-2 rounded-lg font-semibold text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Active Station: {station}</span>
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Date</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <select
                      value={flightDate}
                      onChange={(e) => {
                        setFlightDate(e.target.value);
                        setFlightNumber(''); // Reset flight number when date changes
                      }}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-[#00A651] appearance-none bg-white"
                    >
                      <option value="">Select Date</option>
                      {getDateOptions().map((dateOption) => (
                        <option key={dateOption.value} value={dateOption.value}>
                          {dateOption.label} ({dateOption.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Flight Number Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <select
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                      disabled={!flightDate || isLoadingFlights}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-[#00A651] appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                    >
                      <option value="">
                        {isLoadingFlights ? 'Loading flights...' : !flightDate ? 'Select date first' : 'Select Flight'}
                      </option>
                      {flightNumbers.map((flight, index) => (
                        <option key={index} value={String(flight)}>
                          {flight}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {!flightDate && (
                    <p className="mt-1 text-xs text-gray-500 italic">* Available flights will appear after selecting a date.</p>
                  )}
                </div>

                {/* Start Scanning Button */}
                <button
                  onClick={handleFlightSelect}
                  disabled={!flightNumber || !flightDate || isLoadingFlights}
                  className="w-full bg-gray-300 text-gray-500 px-6 py-4 rounded-lg font-semibold text-base transition-colors disabled:cursor-not-allowed disabled:hover:bg-gray-300 enabled:bg-[#00A651] enabled:text-white enabled:hover:bg-[#008a43] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="6" height="6" rx="1" />
                    <rect x="3" y="15" width="6" height="6" rx="1" />
                    <rect x="15" y="3" width="6" height="6" rx="1" />
                    <rect x="15" y="15" width="6" height="6" rx="1" />
                  </svg>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="6" height="6" rx="1" />
                    <rect x="3" y="15" width="6" height="6" rx="1" />
                    <rect x="15" y="3" width="6" height="6" rx="1" />
                    <rect x="15" y="15" width="6" height="6" rx="1" />
                  </svg>
                  <span>Start Scanning</span>
                </button>

                {/* Footer */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> */}
                    </svg>
                    {/* <span className="hover:text-gray-700 cursor-pointer">Need help? Contact support</span> */}
                  </div>
                  {/* <span className="text-sm text-gray-500">v2.4.1</span> */}
                </div>
              </div>
            </div>
          )}

          {/* Camera View */}
          {currentView === 'camera' && flightDetails && (
            <>
              {/* Disembarkation Progress bg-gray-50 rounded-lg p-4 border border-gray-200  */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-500 mb-1">Disembarkation Progress
                      <span className="text-sm text-gray-500 ml-2">{formattedRoute}</span>

                    </h3>
                    <p className="text-sm text-gray-600">Visualizing scanned passengers against the target.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-500">
                      {flightDetails.disembarkingPassengerCount > 0
                        ? Math.round((scannedPassengers.size / flightDetails.disembarkingPassengerCount) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {scannedPassengers.size}/{flightDetails.disembarkingPassengerCount} Completed
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#00A651] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${flightDetails.disembarkingPassengerCount > 0
                        ? (scannedPassengers.size / flightDetails.disembarkingPassengerCount) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              {/* Remaining Passengers Section - Above Camera */}
              <div className="mb-4 mt-2">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Disembarking</p>
                        <p className="text-lg font-bold text-gray-900">{flightDetails.disembarkingPassengerCount}</p>
                      </div>
                      <div className="w-px h-8 bg-gray-300"></div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Scanned & Matched</p>
                        <p className={`text-lg font-bold ${scannedPassengers.size === flightDetails.disembarkingPassengerCount ? 'text-[#00A651]' : 'text-red-600'}`}>
                          {scannedPassengers.size}
                        </p>
                      </div>
                    </div>
                    {flightDetails.disembarkingPassengerCount > scannedPassengers.size && (
                      <button
                        onClick={() => setShowRemainingPassengers(!showRemainingPassengers)}
                        className="text-sm text-[#00A651] hover:text-[#008a43] font-semibold flex items-center gap-1"
                      >
                        <span>View Remaining ({flightDetails.disembarkingPassengerCount - scannedPassengers.size})</span>
                        <svg className={`w-4 h-4 transition-transform ${showRemainingPassengers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Remaining Passengers List */}
                  {showRemainingPassengers && flightDetails.disembarkingPassengerCount > scannedPassengers.size && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Remaining Passengers:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {flightDetails.disembarkingPassengers
                          ?.filter((p: any) => {
                            const matchKey = `${p.pnrLocator || ''}_${p.seat || ''}`.toUpperCase();
                            return !scannedPassengers.has(matchKey);
                          })
                          .map((passenger: any, index: number) => (
                            <div key={index} className="bg-white rounded p-3 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{passenger.passengerName || passenger.name || 'Unknown'}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-600">Seat: {passenger.seat || 'N/A'}</span>
                                    {passenger.pnrLocator && (
                                      <span className="text-xs text-gray-600">PNR: {passenger.pnrLocator}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )) || (
                            <p className="text-sm text-gray-500 text-center py-2">No remaining passengers data available</p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>


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

              {/* API Connection Error Banner */}
              {apiConnectionError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">API Connection Error</p>
                    <p className="text-xs text-red-700 mt-1">{apiConnectionError}</p>
                    <p className="text-xs text-red-600 mt-1">Please ensure the API server is running and CORS is enabled.</p>
                  </div>
                  <button
                    onClick={() => setApiConnectionError(null)}
                    className="text-red-600 hover:text-red-800"
                    title="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Hidden file input for native camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleNativeCameraCapture}
              />

              {/* Camera Scanner Frame - using ZXing */}
              <div className="relative mb-4 sm:mb-6">
                <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center relative h-[220px] sm:h-[280px] md:h-[480px] min-h-[180px] sm:min-h-[220px] md:min-h-[300px]">
                  {/* Video element - ID required by ZXing decodeFromVideoDevice */}
                  <video
                    ref={videoRef}
                    id="scanner-video"
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover absolute inset-0 z-0 ${isScanning ? 'block' : 'hidden'}`}
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      if (video.paused) {
                        video.play().catch((error: any) => {
                          if (error.name !== 'NotAllowedError' && !error.message?.includes('already playing')) {
                            console.error('Error playing video:', error);
                          }
                        });
                      }
                    }}
                  />

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

                  {/* Status Overlay - Loading, Success, or Error */}
                  {scanStatus && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20 rounded-lg">
                      <div className={`rounded-xl p-6 sm:p-8 shadow-2xl max-w-xs w-full mx-4 ${scanStatus === 'success'
                        ? 'bg-[#00A651]' // ET Green
                        : scanStatus === 'error'
                          ? 'bg-red-600'
                          : 'bg-white'
                        }`}>
                        <div className="flex flex-col items-center">
                          {scanStatus === 'loading' && (
                            <>
                              {/* Spinner */}
                              <div className="relative w-16 h-16 mb-4">
                                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                              <p className="text-lg font-semibold text-gray-900 mb-1">Processing...</p>
                              <p className="text-sm text-gray-600 text-center">Sending image to API for scanning</p>
                            </>
                          )}
                          {scanStatus === 'success' && (
                            <>
                              {/* Check Icon */}
                              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-[#00A651]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <p className="text-xl font-bold text-white mb-1">Success!</p>
                              <p className="text-sm text-white/90 text-center">Boarding pass scanned successfully</p>
                            </>
                          )}
                          {scanStatus === 'error' && (
                            <>
                              {/* X Icon */}
                              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <p className="text-xl font-bold text-white mb-1">Failed</p>
                              <p className="text-sm text-white/90 text-center">Could not scan boarding pass</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Button Group - Native Camera and Web Camera */}
                {!isScanning && !scanResult && (
                  <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-10">
                    {/* Native Camera Button */}
                    <button
                      onClick={openNativeCamera}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation"
                      title="Open Native Camera"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 001.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {/* Web Camera Button */}
                    <button
                      onClick={() => {
                        startCamera();
                      }}
                      className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                      title="Start Web Camera"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
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
              <div className="text-center text-sm text-gray-600 space-y-1 mt-4">
                <p>
                  {isScanning
                    ? 'Point camera at boarding pass barcode and tap the green button to capture & scan'
                    : 'Tap the purple button for native camera or blue button for web camera'}
                </p>
              </div>
              {/* Everything else below camera */}
              <div className="mt-6 space-y-6">


                {/* Header Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-[#00A651] text-gray-900 rounded-full text-xs font-semibold">IN PROGRESS</span>
                      <span className="text-sm text-gray-800">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause Feed
                      </button> */}
                      <button className="px-4 py-1.5 bg-[#00A651] text-white rounded-lg text-sm font-semibold hover:bg-[#008a43] transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Close Flight
                      </button>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-1">Flight ET-{flightDetails.flightNumber}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formattedRoute}</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Passengers */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-700 uppercase font-semibold">Total Passengers</span>
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{flightDetails.totalPassengers}</p>
                    <p className="text-xs text-gray-500">Manifest verified</p>
                  </div>

                  {/* Disembarking Target */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-800 uppercase font-semibold">Disembarking Target</span>
                      <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{flightDetails.disembarkingPassengerCount}</p>
                    <p className="text-xs text-gray-500">Destined for {userStation}</p>
                  </div>

                  {/* Scanned & Matched */}
                  <div className="bg-[#00A651] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white uppercase font-semibold">Scanned & Matched</span>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{scannedPassengers.size}</p>
                    <p className="text-xs text-white/80">
                      {scansInLast5Minutes > 0 ? `+${scansInLast5Minutes} in last 5m` : 'No scans in last 5m'}
                    </p>
                  </div>

                  {/* Remaining */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-800 uppercase font-semibold">Remaining</span>
                      <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-700 mb-1">{Math.max(0, flightDetails.disembarkingPassengerCount - scannedPassengers.size)}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Awaiting scan
                    </p>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Recent Activity Feed</h3>
                      <p className="text-sm text-gray-400">Real-time log of passenger scan events.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                      </button>
                      <button className="px-3 py-1.5 text-sm text-[#00A651] hover:text-[#008a43] font-semibold flex items-center gap-2">
                        View Full Log
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Search and Filter Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Name or PNR..."
                        value={activitySearchQuery}
                        onChange={(e) => setActivitySearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                      />
                    </div>
                    <select 
                      value={activityScanTypeFilter}
                      onChange={(e) => setActivityScanTypeFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="boarding-pass">Boarding Pass</option>
                      <option value="manual">Manual</option>
                    </select>
                    <select className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent">
                      <option>All Statuses</option>
                      <option>Matched</option>
                      <option>Pending</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="10:00 AM"
                          className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                        />
                      </div>
                      <span className="text-gray-400 text-sm">TO</span>
                      <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="--:--"
                          className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                        />
                      </div>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Activity Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Passenger Name</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">PNR Locator</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Seat</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Scan Type</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Scanned At</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flightDetails?.disembarkingPassengers
                          ?.filter((passenger: any) => {
                            // Filter by search query (name or PNR)
                            if (activitySearchQuery) {
                              const query = activitySearchQuery.toLowerCase();
                              const nameMatch = (passenger.passengerName || passenger.name || '').toLowerCase().includes(query);
                              const pnrMatch = (passenger.pnrLocator || '').toLowerCase().includes(query);
                              if (!nameMatch && !pnrMatch) return false;
                            }
                            
                            // Filter by scan type
                            if (activityScanTypeFilter !== 'all') {
                              const matchKey = `${passenger.pnrLocator || ''}_${passenger.seat || ''}`.toUpperCase();
                              const isScanned = scannedPassengers.has(matchKey);
                              
                              if (activityScanTypeFilter === 'manual') {
                                const scanRecord = recentScans.find((scan: any) => {
                                  const scanMatchKey = scan.matchedPassenger 
                                    ? `${scan.matchedPassenger.pnrLocator || ''}_${scan.matchedPassenger.seat || ''}`.toUpperCase()
                                    : null;
                                  return scanMatchKey === matchKey && scan.scanType === 'manual';
                                });
                                if (!scanRecord) return false;
                              } else if (activityScanTypeFilter === 'boarding-pass') {
                                const scanRecord = recentScans.find((scan: any) => {
                                  const scanMatchKey = scan.matchedPassenger 
                                    ? `${scan.matchedPassenger.pnrLocator || ''}_${scan.matchedPassenger.seat || ''}`.toUpperCase()
                                    : null;
                                  return scanMatchKey === matchKey && scan.scanType !== 'manual' && scan.scanType !== 'passport';
                                });
                                if (!scanRecord) return false;
                              }
                            }
                            
                            return true;
                          })
                          .map((passenger: any, index: number) => {
                          const matchKey = `${passenger.pnrLocator || ''}_${passenger.seat || ''}`.toUpperCase();
                          const isScanned = scannedPassengers.has(matchKey);
                          
                          // Find corresponding scan record if exists
                          const scanRecord = recentScans.find((scan: any) => {
                            const scanMatchKey = scan.matchedPassenger 
                              ? `${scan.matchedPassenger.pnrLocator || ''}_${scan.matchedPassenger.seat || ''}`.toUpperCase()
                              : null;
                            return scanMatchKey === matchKey;
                          });

                          const passengerName = passenger.passengerName || passenger.name || 'Unknown';
                          const initials = passengerName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'NA';
                          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500'];
                          
                          return (
                            <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 ${colors[index % colors.length]} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                                    {initials}
                                  </div>
                                  <span className="text-white text-sm">{passengerName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-gray-300 text-sm">{passenger.pnrLocator || 'N/A'}</td>
                              <td className="py-3 px-3 text-gray-300 text-sm">{passenger.seat || 'N/A'}</td>
                              <td className="py-3 px-3">
                                {scanRecord ? (
                                  <span className="text-gray-300 text-sm flex items-center gap-1">
                                    {scanRecord.scanType === 'passport' ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                      </svg>
                                    ) : scanRecord.scanType === 'manual' ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    )}
                                    {scanRecord.scanType === 'passport' ? 'Passport' : scanRecord.scanType === 'manual' ? 'Manual' : 'Boarding Pass'}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-sm">Not Scanned</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                {isScanned ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-[#00A651] rounded-full"></span>
                                    <span className="text-[#00A651] text-sm">Matched</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                    <span className="text-orange-500 text-sm">Pending</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-gray-300 text-sm">
                                {scanRecord?.scannedAt ? new Date(scanRecord.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {!isScanned ? (
                                  <button
                                    onClick={() => handleManualMatch(passenger)}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 bg-[#00A651] hover:bg-[#008a43] disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                    title="Manually match passenger"
                                  >
                                    {isLoading ? (
                                      <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Match
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button className="text-gray-400 hover:text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {(!flightDetails?.disembarkingPassengers || flightDetails.disembarkingPassengers.length === 0) && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                              No disembarking passengers available. Select a flight to see passengers.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Current Scan Result - Below Camera */}
              {scanResult && scanResult.success && scanResult.boardingPass && (
                <div className="mt-4 sm:mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Boarding Pass Scanned</h3>
                      <p className="text-xs text-gray-600">{scanResult.scanTime} • {scanResult.source}</p>
                    </div>
                  </div>

                  {/* Boarding Pass Details */}
                  <div className="bg-white rounded-lg p-4 space-y-3">
                    {scanResult.boardingPass.passengerName && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Passenger Name</p>
                        <p className="text-base font-semibold text-gray-900">{scanResult.boardingPass.passengerName}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {scanResult.boardingPass.flightNumber && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Flight Number</p>
                          <p className="text-sm font-semibold text-gray-900">{scanResult.boardingPass.flightNumber}</p>
                        </div>
                      )}

                      {scanResult.boardingPass.seat && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Seat</p>
                          <p className="text-sm font-semibold text-gray-900">{scanResult.boardingPass.seat}</p>
                        </div>
                      )}

                      {scanResult.boardingPass.date && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Date</p>
                          <p className="text-sm font-semibold text-gray-900">{scanResult.boardingPass.date}</p>
                        </div>
                      )}

                      {scanResult.boardingPass.pnr && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">PNR</p>
                          <p className="text-sm font-semibold text-gray-900">{scanResult.boardingPass.pnr}</p>
                        </div>
                      )}
                    </div>

                    {scanResult.boardingPass.airline && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Airline</p>
                        <p className="text-sm font-semibold text-gray-900">{scanResult.boardingPass.airline}</p>
                      </div>
                    )}

                    {/* Show raw barcode if no structured data found */}
                    {!scanResult.boardingPass.passengerName && !scanResult.boardingPass.flightNumber && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-2">Barcode Data</p>
                        <p className="text-xs font-mono text-gray-700 break-all bg-gray-50 p-2 rounded border">
                          {scanResult.barcodeText || scanResult.boardingPass.raw}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}



              {/* Recent Scans - Below Camera */}
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Recent Scans</h3>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{recentScans.length} scanned</span>
                </div>
                {recentScans.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {scan.boardingPass.passengerName && (
                              <p className="text-sm font-semibold text-gray-900">{scan.boardingPass.passengerName}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {scan.boardingPass.flightNumber && (
                                <span className="text-xs text-gray-600">Flight: {scan.boardingPass.flightNumber}</span>
                              )}
                              {scan.boardingPass.seat && (
                                <span className="text-xs text-gray-600">Seat: {scan.boardingPass.seat}</span>
                              )}
                              {scan.boardingPass.pnr && (
                                <span className="text-xs text-gray-600">PNR: {scan.boardingPass.pnr}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{scan.scanTime} • {scan.source}</p>
                          </div>
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No scans yet. Start scanning to see results here.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
