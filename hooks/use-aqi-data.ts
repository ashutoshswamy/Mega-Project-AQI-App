import { AqiCategory, AqiData, AqiState } from "@/types/aqi";
import mqtt from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";

const CONNECTION_TIMEOUT_MS = 10000;

// Helper to determine AQI Category
function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthy_sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

// Build MQTT WebSocket URL from broker and port
function buildMqttUrl(brokerUrl: string, port: string): string {
  // Remove any protocol prefix if user added one
  const cleanUrl = brokerUrl
    .replace(/^(wss?|mqtts?):\/\//, "")
    .replace(/\/.*$/, "");
  // Use wss:// for secure WebSocket connection
  return `wss://${cleanUrl}:${port}/mqtt`;
}

export interface UseAqiDataParams {
  brokerUrl: string;
  port: string;
  topic: string;
}

export function useAqiData({ brokerUrl, port, topic }: UseAqiDataParams) {
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

  const subscribeToTopic = useCallback(
    (client: mqtt.MqttClient) => {
      // Subscribe only - no publishing
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error("Subscription error:", err);
          setState((prev) => ({
            ...prev,
            error: "Failed to subscribe to topic: " + topic,
          }));
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    },
    [topic]
  );

  const connectToMqtt = useCallback(() => {
    try {
      // Clean up existing connection
      if (clientRef.current) {
        clientRef.current.end(true);
        clientRef.current = null;
      }

      // Clear data when reconnecting - don't show stale data
      setState({
        data: null,
        loading: true,
        error: null,
        lastUpdated: null,
        isOffline: false,
      });
      setIsConnected(false);

      const mqttUrl = buildMqttUrl(brokerUrl, port);
      console.log(`Connecting to MQTT: ${mqttUrl}, topic: ${topic}`);

      // Set a timeout - show error if connection fails, no dummy data
      connectionTimeoutRef.current = setTimeout(() => {
        console.log("MQTT Connection timed out");
        if (clientRef.current?.connected) return;

        // Don't show dummy data - just show error
        setState({
          data: null,
          loading: false,
          error: "Connection timed out - Check your broker settings",
          lastUpdated: null,
          isOffline: true,
        });
        setIsConnected(false);
      }, CONNECTION_TIMEOUT_MS) as any;

      const client = mqtt.connect(mqttUrl, {
        clientId: `aqi-app-${Date.now()}`,
        keepalive: 30,
        reconnectPeriod: 5000,
        connectTimeout: CONNECTION_TIMEOUT_MS,
        clean: true,
      });

      clientRef.current = client;

      client.on("connect", () => {
        console.log("Connected to MQTT Broker");
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        setIsConnected(true);
        subscribeToTopic(client);

        setState((prev) => ({
          ...prev,
          isOffline: false,
          error: null,
          loading: true, // Still loading until we receive data
        }));
      });

      client.on("reconnect", () => {
        console.log("Reconnecting to MQTT Broker...");
        // Clear data when disconnected - don't show stale values
        setState({
          data: null,
          loading: true,
          error: null,
          lastUpdated: null,
          isOffline: true,
        });
        setIsConnected(false);
      });

      client.on("message", (receivedTopic, message) => {
        if (receivedTopic === topic) {
          try {
            const raw = JSON.parse(message.toString());

            // Map raw sensor data to AqiData interface
            const aqi = raw.aqi || 0;
            const data: AqiData = {
              device_id: raw.device_id || "sen55-mqtt-node",
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

            // Update state with new data
            setState({
              data,
              loading: false,
              error: null,
              lastUpdated: new Date(),
              isOffline: false,
            });
          } catch (e) {
            console.error("Failed to parse MQTT message", e);
          }
        }
      });

      client.on("error", (err) => {
        console.error("MQTT connection error:", err);
        setIsConnected(false);
        // Don't show dummy data on error - show null
        setState({
          data: null,
          loading: false,
          error: "Connection Error: " + err.message,
          lastUpdated: null,
          isOffline: true,
        });
      });

      client.on("offline", () => {
        console.log("MQTT Client Offline");
        setIsConnected(false);
        // Clear data when offline - don't show stale values
        setState({
          data: null,
          loading: false,
          error: "Disconnected from broker",
          lastUpdated: null,
          isOffline: true,
        });
      });

      client.on("close", () => {
        console.log("MQTT Connection closed");
        setIsConnected(false);
      });
    } catch (err) {
      console.error("MQTT setup error", err);
      setIsConnected(false);
      // Don't show dummy data on error
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to connect",
        lastUpdated: null,
        isOffline: true,
      });
    }
  }, [brokerUrl, port, topic, subscribeToTopic]);

  const refresh = useCallback(() => {
    console.log("Manual refresh triggered");
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
        console.log("MQTT Disconnected");
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
  if (!lastUpdated) return "Never";

  const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 120) return "1 min ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}
