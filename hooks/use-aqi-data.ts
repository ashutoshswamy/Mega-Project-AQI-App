import { AqiCategory, AqiData, AqiState } from '@/types/aqi';
import mqtt from 'mqtt';
import { useCallback, useEffect, useRef, useState } from 'react';

// Configure MQTT Broker - Update this with your Broker's IP
// Note: Browser/Expo apps using 'mqtt' keys usually require WebSockets (ws:// or wss://)
// Standard MQTT port is 1883, WebSockets usually 9001 or 8083 depending on broker config.
const MQTT_BROKER_URL = 'ws://192.168.1.100:9001'; 
const MQTT_TOPIC = 'sensor/aqi';
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

export function useAqiData() {
  const [state, setState] = useState<AqiState>({
    data: null, // Start with null
    loading: true,
    error: null,
    lastUpdated: null,
    isOffline: false,
  });

  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectToMqtt = useCallback(() => {
    try {
      if (clientRef.current) {
        clientRef.current.end();
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

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
      }, CONNECTION_TIMEOUT_MS) as any;

      const client = mqtt.connect(MQTT_BROKER_URL, {
        clientId: `aqi_app_${Math.random().toString(16).substr(2, 8)}`,
        keepalive: 60,
        reconnectPeriod: 5000,
      });

      clientRef.current = client;

      client.on('connect', () => {
        console.log('Connected to MQTT Broker');
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

        client.subscribe(MQTT_TOPIC, (err) => {
          if (err) {
            console.error('Subscription error:', err);
            setState(prev => ({ ...prev, error: 'Failed to subscribe to sensor data' }));
          } else {
            console.log(`Subscribed to ${MQTT_TOPIC}`);
          }
        });
        setState(prev => ({ ...prev, isOffline: false, error: null }));
      });

      client.on('message', (topic, message) => {
        if (topic === MQTT_TOPIC) {
          try {
            const raw = JSON.parse(message.toString());
            
            // Map raw sensor data to AqiData interface
            const aqi = raw.aqi || 0;
            const data: AqiData = {
                device_id: 'sen55-mqtt-node', 
                timestamp: new Date().toISOString(),
                pm1_0: raw.pm1 || 0,
                pm2_5: raw.pm2_5 || 0,
                pm4_0: raw.pm4 || 0,
                pm10: raw.pm10 || 0,
                temperature: raw.temp || 0,
                humidity: raw.rh || 0,
                voc_index: raw.voc || 0,
                nox_index: raw.nox || 0,
                aqi: aqi,
                aqi_category: getAqiCategory(aqi),
            };

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
        // Don't show error immediately, let the timeout handle fallback or show offline
        setState(prev => ({
          ...prev,
          loading: false,
          // If we already have dummy data, keep it? 
          // For now, if error, show dummy data if no data exists
           data: prev.data || DUMMY_DATA,
           error: 'MQTT Connection Error: ' + err.message,
           isOffline: true,
        }));
      });

      client.on('offline', () => {
        console.log('MQTT Client Offline');
        setState(prev => ({ 
            ...prev, 
            isOffline: true,
            data: prev.data || DUMMY_DATA // Show dummy data if offline
        }));
      });

    } catch (err) {
      console.error('MQTT setup error', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: DUMMY_DATA, // Fallback
        error: err instanceof Error ? err.message : 'Failed to connect' 
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    // Reconnect logic
    connectToMqtt();
  }, [connectToMqtt]);

  useEffect(() => {
    connectToMqtt();
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (clientRef.current) {
        clientRef.current.end();
        console.log('MQTT Disconnected');
      }
    };
  }, [connectToMqtt]);

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
