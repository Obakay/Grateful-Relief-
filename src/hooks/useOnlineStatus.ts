import { useEffect, useState } from 'react';

export interface ConnectivityState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  downlinkSpeed?: number;
  effectiveType?: string;
}

export function useOnlineStatus(): ConnectivityState {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [downlinkSpeed, setDownlinkSpeed] = useState<number | undefined>(undefined);
  const [effectiveType, setEffectiveType] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Briefly track that we transitioned from offline to online
      setWasOffline(true);
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API for connection speed if available (e.g. Chrome Android)
    const navConn = (navigator as unknown as { connection?: { downlink?: number; effectiveType?: string; addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }).connection;

    const updateConnectionInfo = () => {
      if (navConn) {
        setDownlinkSpeed(navConn.downlink);
        setEffectiveType(navConn.effectiveType);
      }
    };

    if (navConn) {
      updateConnectionInfo();
      if (navConn.addEventListener) {
        navConn.addEventListener('change', updateConnectionInfo);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navConn && navConn.removeEventListener) {
        navConn.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    downlinkSpeed,
    effectiveType,
  };
}
