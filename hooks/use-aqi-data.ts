import { AqiData, AqiState } from '@/types/aqi';
import { useCallback, useEffect, useRef, useState } from 'react';

// Configure ESP32 endpoint - update this with your ESP32's IP address
const ESP32_BASE_URL = 'http://192.168.1.100'; // Change to your ESP32 IP
const AQI_ENDPOINT = `${ESP32_BASE_URL}/aqi`;
const REFRESH_INTERVAL = 5000; // 5 seconds
const FETCH_TIMEOUT = 10000; // 10 seconds

export function useAqiData() {
  const [state, setState] = useState<AqiState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isOffline: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAqiData = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setState(prev => ({ ...prev, loading: prev.data === null, error: null }));

      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, FETCH_TIMEOUT);

      const response = await fetch(AQI_ENDPOINT, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AqiData = await response.json();

      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
        isOffline: false,
      });
    } catch (err) {
      const isAborted = err instanceof Error && err.name === 'AbortError';
      
      if (!isAborted) {
        const isNetworkError = err instanceof TypeError && err.message.includes('Network');
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: isNetworkError 
            ? 'Cannot connect to sensor. Check WiFi connection.'
            : err instanceof Error ? err.message : 'Failed to fetch data',
          isOffline: isNetworkError,
        }));
      }
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAqiData();
  }, [fetchAqiData]);

  useEffect(() => {
    // Initial fetch
    fetchAqiData();

    // Set up auto-refresh interval
    intervalRef.current = setInterval(fetchAqiData, REFRESH_INTERVAL);

    return () => {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAqiData]);

  return {
    ...state,
    refresh,
  };
}

// Helper to get time since last update
export function getTimeSinceUpdate(lastUpdated: Date | null): string {
  if (!lastUpdated) return 'Never';
  
  const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 120) return '1 min ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}
