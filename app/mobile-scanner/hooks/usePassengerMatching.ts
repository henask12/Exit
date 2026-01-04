import { useState, useCallback } from 'react';

export function usePassengerMatching(flightDetails: any) {
  const [scannedPassengers, setScannedPassengers] = useState<Set<string>>(new Set());

  const matchPassenger = useCallback((boardingPassData: any): { matched: boolean; passenger?: any; matchKey?: string } => {
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
  }, [flightDetails]);

  const addScannedPassenger = useCallback((matchKey: string) => {
    setScannedPassengers((prev) => new Set([...prev, matchKey]));
  }, []);

  const resetScannedPassengers = useCallback(() => {
    setScannedPassengers(new Set());
  }, []);

  return {
    scannedPassengers,
    matchPassenger,
    addScannedPassenger,
    resetScannedPassengers,
  };
}

