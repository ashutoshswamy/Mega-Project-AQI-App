/**
 * AQI Data Types
 * Matches the JSON schema from ESP32 /aqi endpoint
 */

export interface AqiData {
  device_id: string;
  timestamp: string;
  pm1_0: number;
  pm2_5: number;
  pm4_0: number;
  pm10: number;
  voc_index: number;
  nox_index: number;
  temperature: number;
  humidity: number;
  aqi: number;
  aqi_category: AqiCategory;
}

export type AqiCategory =
  | "good"
  | "moderate"
  | "unhealthy_sensitive"
  | "unhealthy"
  | "very_unhealthy"
  | "hazardous";

export interface AqiState {
  data: AqiData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOffline: boolean;
}

// AQI color mapping
export const AQI_COLORS: Record<AqiCategory, string> = {
  good: "#22C55E",
  moderate: "#EAB308",
  unhealthy_sensitive: "#F97316",
  unhealthy: "#EF4444",
  very_unhealthy: "#A855F7",
  hazardous: "#7C2D12",
};

// AQI labels
export const AQI_LABELS: Record<AqiCategory, string> = {
  good: "Good",
  moderate: "Moderate",
  unhealthy_sensitive: "Unhealthy for Sensitive Groups",
  unhealthy: "Unhealthy",
  very_unhealthy: "Very Unhealthy",
  hazardous: "Hazardous",
};
