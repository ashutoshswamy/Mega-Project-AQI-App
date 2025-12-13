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
  | 'good' 
  | 'moderate' 
  | 'unhealthy_sensitive' 
  | 'unhealthy' 
  | 'very_unhealthy' 
  | 'hazardous';

export interface AqiState {
  data: AqiData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOffline: boolean;
}

// AQI color mapping
export const AQI_COLORS: Record<AqiCategory, string> = {
  good: '#22C55E',
  moderate: '#EAB308',
  unhealthy_sensitive: '#F97316',
  unhealthy: '#EF4444',
  very_unhealthy: '#A855F7',
  hazardous: '#7C2D12',
};

// AQI labels
export const AQI_LABELS: Record<AqiCategory, string> = {
  good: 'Good',
  moderate: 'Moderate',
  unhealthy_sensitive: 'Unhealthy for Sensitive Groups',
  unhealthy: 'Unhealthy',
  very_unhealthy: 'Very Unhealthy',
  hazardous: 'Hazardous',
};

// Health tips based on AQI category
export const HEALTH_TIPS: Record<AqiCategory, string> = {
  good: "Air quality is excellent. It's a great time to open windows or go for a run outside.",
  moderate: "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.",
  unhealthy_sensitive: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
  unhealthy: "Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.",
  very_unhealthy: "Health alert: everyone may experience more serious health effects. Avoid outdoor activities.",
  hazardous: "Health warning of emergency conditions. The entire population is likely to be affected. Stay indoors.",
};
