import { AqiCategory, AqiData, AqiState } from '@/types/aqi';
import mqtt from 'mqtt';
import { useCallback, useEffect, useRef, useState } from 'react';

const CONNECTION_TIMEOUT_MS = 5000;

// Dummy data for offline/demo mode
const DUMMY_DATA: AqiData = {
  device_id: 'demo-device-001',
  timestamp: new Date().toISOString(),
  pm1_0: 12.5,
  pm2_5: 25.4,
  pm4_0: 30.1,
  pm10: 45.2,
  temperature: 24.5,
  humidity: 52.0,
  voc_index: 120,
  nox_index: 15,
  aqi: 78,
  aqi_category: 'moderate',
};

// Helper to determine AQI Category
function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export interface UseAqiDataParams {
  brokerUrl: string;
  topic: string;
}

export function useAqiData({ brokerUrl, topic }: UseAqiDataParams) {
  const [state, setState] = useState<AqiState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isOffline: false,
  });
  
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const subscribeToTopic = useCallback((client: mqtt.MqttClient) => {
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        console.error('Subscription error:', err);
        setState(prev => ({ ...prev, error: 'Failed to subscribe to sensor data' }));
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  }, [topic]);

  const connectToMqtt = useCallback(() => {
    try {
      // Clean up existing connection
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      setIsConnected(false);

      // Set a timeout to fall back to dummy data if connection takes too long
      connectionTimeoutRef.current = setTimeout(() => {
        console.log('MQTT Connection timed out, switching to dummy data');
        if (clientRef.current?.connected) return;
        
        setState({
          data: DUMMY_DATA,
          loading: false,
          error: 'Connection timed out - Showing Demo Data',
          lastUpdated: new Date(),
          isOffline: true,
        });
        setIsConnected(false);
      }, CONNECTION_TIMEOUT_MS) as any;

      const client = mqtt.connect(brokerUrl, {
        clientId: 'aqi-app-ashutosh',
        keepalive: 30,
        reconnectPeriod: 3000,
        connectTimeout: CONNECTION_TIMEOUT_MS,
        clean: true,
      });

      clientRef.current = client;

      client.on('connect', () => {
        console.log('Connected to MQTT Broker');
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setIsConnected(true);
        subscribeToTopic(client);
        
        setState(prev => ({ 
          ...prev, 
          isOffline: false, 
          error: null,
          loading: !prev.data, // Only show loading if we don't have data yet
        }));
      });

      client.on('reconnect', () => {
        console.log('Reconnecting to MQTT Broker...');
        setState(prev => ({ ...prev, isOffline: true }));
        setIsConnected(false);
      });

      client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          try {
            const raw = JSON.parse(message.toString());
            
            // Map raw sensor data to AqiData interface
            const aqi = raw.aqi || 0;
            const data: AqiData = {
              device_id: raw.device_id || 'sen55-mqtt-node', 
              timestamp: new Date().toISOString(),
              pm1_0: raw.pm1 ?? raw.pm1_0 ?? 0,
              pm2_5: raw.pm2_5 ?? 0,
              pm4_0: raw.pm4 ?? raw.pm4_0 ?? 0,
              pm10: raw.pm10 ?? 0,
              temperature: raw.temp ?? raw.temperature ?? 0,
              humidity: raw.rh ?? raw.humidity ?? 0,
              voc_index: raw.voc ?? raw.voc_index ?? 0,
              nox_index: raw.nox ?? raw.nox_index ?? 0,
              aqi: aqi,
              aqi_category: getAqiCategory(aqi),
            };

            // Update state immediately with new data
            setState({
              data,
              loading: false,
              error: null,
              lastUpdated: new Date(),
              isOffline: false,
            });
          } catch (e) {
            console.error('Failed to parse MQTT message', e);
          }
        }
      });

      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        setIsConnected(false);
        setState(prev => ({
          ...prev,
          loading: false,
          data: prev.data || DUMMY_DATA,
          error: 'MQTT Connection Error: ' + err.message,
          isOffline: true,
        }));
      });

      client.on('offline', () => {
        console.log('MQTT Client Offline');
        setIsConnected(false);
        setState(prev => ({ 
          ...prev, 
          isOffline: true,
          data: prev.data || DUMMY_DATA,
        }));
      });

      client.on('close', () => {
        console.log('MQTT Connection closed');
        setIsConnected(false);
      });

    } catch (err) {
      console.error('MQTT setup error', err);
      setIsConnected(false);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: DUMMY_DATA,
        error: err instanceof Error ? err.message : 'Failed to connect',
        isOffline: true,
      }));
    }
  }, [brokerUrl, subscribeToTopic]);

  const refresh = useCallback(() => {
    console.log('Manual refresh triggered');
    connectToMqtt();
  }, [connectToMqtt]);

  useEffect(() => {
    connectToMqtt();
    
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
        console.log('MQTT Disconnected');
      }
    };
  }, [connectToMqtt]);

  return {
    ...state,
    isConnected,
    refresh,
  };
}

// Helper to get time since last update
export function getTimeSinceUpdate(lastUpdated: Date | null): string {
  if (!lastUpdated) return 'Never';
  
  const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 120) return '1 min ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}

