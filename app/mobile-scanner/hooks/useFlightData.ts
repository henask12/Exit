import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/auth';

export function useFlightData(station: string) {
  const router = useRouter();
  const [flightDate, setFlightDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightNumbers, setFlightNumbers] = useState<number[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [flightDetails, setFlightDetails] = useState<any>(null);

  const fetchFlightNumbers = useCallback(async (station: string, flightDate: string) => {
    if (!station || !flightDate) return;
    
    try {
      setIsLoadingFlights(true);
      const response = await apiCall(`/Flight/numbers?station=${station}&flightDate=${flightDate}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`);
      }
      
      const data = await response.json();
      let flights: number[] = [];
      if (Array.isArray(data)) {
        flights = data.map((item: any) => typeof item === 'number' ? item : Number(item));
      } else if (data.flights && Array.isArray(data.flights)) {
        flights = data.flights.map((item: any) => typeof item === 'number' ? item : Number(item));
      } else if (data.flightNumbers && Array.isArray(data.flightNumbers)) {
        flights = data.flightNumbers.map((item: any) => typeof item === 'number' ? item : Number(item));
      }
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
    if (!station || !flightNumber || !flightDate) return null;
    
    try {
      setIsLoadingFlights(true);
      const response = await apiCall(`/Flight/details?flightNumber=${flightNumber}&date=${flightDate}&station=${station}`, {
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

  useEffect(() => {
    if (station && flightDate) {
      fetchFlightNumbers(station, flightDate);
    }
  }, [station, flightDate, fetchFlightNumbers]);

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

