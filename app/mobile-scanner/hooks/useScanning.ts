import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall, API_BASE_URL } from '@/lib/auth';
import { useNotifications } from '@/hooks/useNotifications';

export function useScanning() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const isProcessingScanRef = useRef<boolean>(false);

  const scanBoardingPassAPI = useCallback(async (imageBlob: Blob): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'boarding-pass.jpg');

      const response = await apiCall('/BoardingPass/scan', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('API scan error:', error);
      if (error.message?.includes('Unauthorized')) {
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }, [router]);

  const scanImage = useCallback(async (imageBlob: Blob) => {
    if (isProcessingScanRef.current) {
      return null;
    }

    try {
      isProcessingScanRef.current = true;
      setIsLoading(true);
      setScanStatus('loading');

      const apiResult = await scanBoardingPassAPI(imageBlob);

      if (apiResult && apiResult.passengerName) {
        setScanStatus('success');
        const scanData = {
          ...apiResult,
          timestamp: new Date().toISOString(),
        };
        setRecentScans((prev) => [scanData, ...prev]);
        addNotification('success', 'Passenger scanned', `${apiResult.passengerName} - Seat: ${apiResult.seat || 'N/A'}`);
        
        setTimeout(() => {
          setScanStatus(null);
        }, 2000);

        return apiResult;
      } else {
        setScanStatus('error');
        addNotification('warning', 'Scan failed', apiResult.error || 'Could not decode boarding pass');
        setTimeout(() => {
          setScanStatus(null);
        }, 2000);
        return null;
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      setScanStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      addNotification('error', 'API Error', `Failed to scan: ${errorMessage}`);
      setTimeout(() => {
        setScanStatus(null);
      }, 2000);
      return null;
    } finally {
      setIsLoading(false);
      isProcessingScanRef.current = false;
    }
  }, [scanBoardingPassAPI, addNotification]);

  const removeScan = useCallback((index: number) => {
    setRecentScans((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    isLoading,
    scanStatus,
    recentScans,
    scanImage,
    removeScan,
  };
}

