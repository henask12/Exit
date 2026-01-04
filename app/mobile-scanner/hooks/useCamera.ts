import { useRef, useEffect, useCallback, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selectedDeviceIdRef = useRef<string | undefined>(undefined);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [isScanning, setIsScanning] = useState(false);

  // Initialize ZXing
  useEffect(() => {
    const initZXing = async () => {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
        console.log('ZXing barcode reader initialized');
        
        try {
          const videoInputDevices = await (codeReaderRef.current as any).listVideoInputDevices();
          if (videoInputDevices.length > 0) {
            const backCamera = videoInputDevices.find((device: any) => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('environment')
            );
            selectedDeviceIdRef.current = backCamera?.deviceId || videoInputDevices[0].deviceId;
          }
        } catch (err) {
          console.warn('Could not list video devices:', err);
        }
      }
    };
    
    initZXing();
    
    return () => {
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

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !codeReaderRef.current) {
      console.error('Video element or code reader not initialized');
      return;
    }

    try {
      setCameraPermission('checking');
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceIdRef.current ? { exact: selectedDeviceIdRef.current } : undefined,
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      setCameraPermission('granted');
      setIsScanning(true);
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            resolve(undefined);
          };
        }
      });
    } catch (error: any) {
      console.error('Error starting camera:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
      } else {
        setCameraPermission('denied');
      }
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (codeReaderRef.current) {
      try {
        (codeReaderRef.current as any).reset();
      } catch (e) {
        // Ignore reset errors
      }
    }
    setIsScanning(false);
  }, []);

  const captureFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) {
        reject(new Error('Video element not available'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.9);
    });
  }, []);

  return {
    videoRef,
    codeReaderRef,
    streamRef,
    cameraPermission,
    isScanning,
    startCamera,
    stopCamera,
    captureFrame,
  };
}

