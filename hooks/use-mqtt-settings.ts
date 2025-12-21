import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

// Storage keys
const MQTT_BROKER_URL_KEY = "mqtt_broker_url";
const MQTT_PORT_KEY = "mqtt_port";
const MQTT_TOPIC_KEY = "mqtt_topic";

// Default values
export const DEFAULT_MQTT_BROKER_URL = "broker.hivemq.com";
export const DEFAULT_MQTT_PORT = "8884";
export const DEFAULT_MQTT_TOPIC = "ashutosh/aqi/sen55";

export interface MqttSettings {
  brokerUrl: string;
  port: string;
  topic: string;
}

/**
 * Get MQTT settings from AsyncStorage
 */
export async function getMqttSettings(): Promise<MqttSettings> {
  try {
    const [brokerUrl, port, topic] = await Promise.all([
      AsyncStorage.getItem(MQTT_BROKER_URL_KEY),
      AsyncStorage.getItem(MQTT_PORT_KEY),
      AsyncStorage.getItem(MQTT_TOPIC_KEY),
    ]);

    return {
      brokerUrl: brokerUrl || DEFAULT_MQTT_BROKER_URL,
      port: port || DEFAULT_MQTT_PORT,
      topic: topic || DEFAULT_MQTT_TOPIC,
    };
  } catch (error) {
    console.error("Failed to load MQTT settings:", error);
    return {
      brokerUrl: DEFAULT_MQTT_BROKER_URL,
      port: DEFAULT_MQTT_PORT,
      topic: DEFAULT_MQTT_TOPIC,
    };
  }
}

/**
 * Save MQTT settings to AsyncStorage
 */
export async function saveMqttSettings(
  settings: MqttSettings
): Promise<boolean> {
  try {
    await Promise.all([
      AsyncStorage.setItem(MQTT_BROKER_URL_KEY, settings.brokerUrl),
      AsyncStorage.setItem(MQTT_PORT_KEY, settings.port),
      AsyncStorage.setItem(MQTT_TOPIC_KEY, settings.topic),
    ]);
    return true;
  } catch (error) {
    console.error("Failed to save MQTT settings:", error);
    return false;
  }
}

/**
 * Hook to manage MQTT settings with AsyncStorage persistence
 */
export function useMqttSettings() {
  const [settings, setSettings] = useState<MqttSettings>({
    brokerUrl: DEFAULT_MQTT_BROKER_URL,
    port: DEFAULT_MQTT_PORT,
    topic: DEFAULT_MQTT_TOPIC,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;

    getMqttSettings().then((loadedSettings) => {
      if (mounted) {
        setSettings(loadedSettings);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Update a single setting locally
  const updateSetting = useCallback(
    <K extends keyof MqttSettings>(key: K, value: MqttSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Save current settings to storage
  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    const success = await saveMqttSettings(settings);
    setIsSaving(false);
    return success;
  }, [settings]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings({
      brokerUrl: DEFAULT_MQTT_BROKER_URL,
      port: DEFAULT_MQTT_PORT,
      topic: DEFAULT_MQTT_TOPIC,
    });
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    updateSetting,
    save,
    resetToDefaults,
  };
}
