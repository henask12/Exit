import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/auth';

export function useFlightData(station: string) {
  const router = useRouter();
  // Default to today's date
  const [flightDate, setFlightDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [flightNumber, setFlightNumber] = useState('');
  const [flightNumbers, setFlightNumbers] = useState<number[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [flightDetails, setFlightDetails] = useState<any>(null);

  const fetchFlightNumbers = useCallback(async () => {
    try {
      setIsLoadingFlights(true);
      const response = await apiCall(`/Flight/numbers`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }
      
      const data = await response.json();
      let flights: number[] = [];
      if (Array.isArray(data)) {
        flights = data
          .map((item: unknown) => {
            const num = typeof item === 'number' ? item : Number(item);
            return isNaN(num) ? null : num;
          })
          .filter((item: number | null): item is number => item !== null);
      } else if (data.flights && Array.isArray(data.flights)) {
        flights = data.flights
          .map((item: unknown) => {
            const num = typeof item === 'number' ? item : Number(item);
            return isNaN(num) ? null : num;
          })
          .filter((item: number | null): item is number => item !== null);
      } else if (data.flightNumbers && Array.isArray(data.flightNumbers)) {
        flights = data.flightNumbers
          .map((item: unknown) => {
            const num = typeof item === 'number' ? item : Number(item);
            return isNaN(num) ? null : num;
          })
          .filter((item: number | null): item is number => item !== null);
      }
      
      // Sort flight numbers in ascending order
      flights.sort((a, b) => a - b);
      setFlightNumbers(flights);
    } catch (error: any) {
      console.error('Error fetching flight numbers:', error);
      if (error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
      setFlightNumbers([]);
    } finally {
      setIsLoadingFlights(false);
    }
  }, [router]);

  const fetchFlightDetails = useCallback(async (station: string, flightNumber: string, flightDate: string) => {
    if (!station || !flightNumber || !flightDate) {
      console.error('Missing required parameters:', { station, flightNumber, flightDate });
      return null;
    }
    
    try {
      setIsLoadingFlights(true);
      const url = `/Flight/details?flightNumber=${encodeURIComponent(flightNumber)}&date=${encodeURIComponent(flightDate)}&station=${encodeURIComponent(station)}`;
      const response = await apiCall(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flight details: ${response.status}`);
      }
      
      const data = await response.json();
      setFlightDetails(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching flight details:', error);
      if (error.message?.includes('Unauthorized')) {
        router.push('/login');
      }
      throw error;
    } finally {
      setIsLoadingFlights(false);
    }
  }, [router]);

  // Automatically fetch flight numbers on mount
  useEffect(() => {
    fetchFlightNumbers();
  }, [fetchFlightNumbers]);

  return {
    flightDate,
    flightNumber,
    flightNumbers,
    isLoadingFlights,
    flightDetails,
    setFlightDate,
    setFlightNumber,
    fetchFlightDetails,
    setFlightDetails,
  };
}

