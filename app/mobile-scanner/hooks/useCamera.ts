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
    if (!videoRef.current) {
      console.error('Video element not initialized');
      return;
    }

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      setCameraPermission('checking');
      
      // Try with deviceId first, fallback to facingMode
      let constraints: MediaStreamConstraints;
      
      if (selectedDeviceIdRef.current) {
        constraints = {
          video: {
            deviceId: { exact: selectedDeviceIdRef.current },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
      } else {
        constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
      }

      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error('No video tracks available in stream');
      }
      
      streamRef.current = stream;
      
      // Set the stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          
          const video = videoRef.current;
          let resolved = false;
          
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('error', onError);
          };
          
          const doResolve = () => {
            if (!resolved) {
              resolved = true;
              cleanup();
              clearTimeout(timeoutId);
              resolve();
            }
          };
          
          const onLoadedMetadata = () => {
            console.log('Video metadata loaded', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState
            });
            
            // Ensure video plays
            video.play().catch((playError) => {
              console.warn('Video play() failed, but continuing:', playError);
            });
            
            doResolve();
          };
          
          // Also listen for canplay event as backup
          const onCanPlay = () => {
            console.log('Video can play');
            video.play().catch((playError) => {
              console.warn('Video play() failed:', playError);
            });
            doResolve();
          };
          
          const onError = (e: Event) => {
            console.error('Video element error:', e);
            if (!resolved) {
              resolved = true;
              cleanup();
              clearTimeout(timeoutId);
              reject(new Error('Video element failed to load'));
            }
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('error', onError);
          
          // Timeout after 5 seconds
          const timeoutId = setTimeout(() => {
            if (!resolved) {
              if (video.readyState >= 2) {
                // Video is ready, resolve
                doResolve();
              } else {
                resolved = true;
                cleanup();
                reject(new Error('Video loading timeout'));
              }
            }
          }, 5000);
        });
      }
      
      setCameraPermission('granted');
      setIsScanning(true);
      console.log('Camera started successfully');
    } catch (error: any) {
      console.error('Error starting camera:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      
      // Try fallback with simpler constraints
      if (error.name !== 'NotAllowedError' && error.name !== 'PermissionDeniedError') {
        try {
          console.log('Trying fallback with simpler constraints');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          
          if (videoRef.current && fallbackStream) {
            streamRef.current = fallbackStream;
            videoRef.current.srcObject = fallbackStream;
            setCameraPermission('granted');
            setIsScanning(true);
            console.log('Camera started with fallback constraints');
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback camera start also failed:', fallbackError);
        }
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

