# AQI App - Technical Documentation

This document provides in-depth technical documentation for developers working on the AQI App.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Documentation](#component-documentation)
3. [Hooks Reference](#hooks-reference)
4. [Type Definitions](#type-definitions)
5. [Theming System](#theming-system)
6. [MQTT Protocol](#mqtt-protocol)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Data Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   SEN55 Sensor  │────▶│  ESP32 / MCU    │────▶│  MQTT Broker    │
│   (Hardware)    │     │  (Publisher)    │     │  (Mosquitto)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         │ WebSocket
                                                         ▼
                        ┌─────────────────────────────────────────────┐
                        │               AQI Mobile App                │
                        │  ┌─────────────┐    ┌───────────────────┐  │
                        │  │ useAqiData  │───▶│   UI Components   │  │
                        │  │   (Hook)    │    │ (Gauge, Cards)    │  │
                        │  └─────────────┘    └───────────────────┘  │
                        └─────────────────────────────────────────────┘
```

### Technology Stack Details

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | React Native | 0.81.5 |
| Build System | Expo | 54.0 |
| Language | TypeScript | 5.9 |
| Navigation | Expo Router | 6.0 |
| Real-time | MQTT.js | 5.14 |
| Icons | Lucide React Native | 0.561 |
| Animations | React Native Reanimated | 4.1 |

---

## Component Documentation

### AQI Components (`/components/aqi/`)

#### `aqi-gauge.tsx`
A circular gauge component that visually displays the current AQI value.

**Props:**
```typescript
interface AqiGaugeProps {
  aqi: number;           // Current AQI value (0-500)
  category: AqiCategory; // AQI category for color coding
  lastUpdated: string;   // Human-readable timestamp
}
```

**Usage:**
```tsx
<AqiGauge 
  aqi={78} 
  category="moderate" 
  lastUpdated="2 mins ago" 
/>
```

---

#### `metric-card.tsx`
Individual card component for displaying a single metric.

**Props:**
```typescript
interface MetricCardProps {
  icon: ReactNode;  // Icon component (from lucide-react-native)
  label: string;    // Metric label (e.g., "PM2.5")
  value: string | number;  // Metric value
  unit: string;     // Unit of measurement (e.g., "µg/m³")
}
```

**Usage:**
```tsx
<MetricCard
  icon={<Wind size={16} color="#3B82F6" />}
  label="PM2.5"
  value="25.4"
  unit="µg/m³"
/>
```

---

#### `health-tip.tsx`
Displays context-aware health recommendations.

**Props:**
```typescript
interface HealthTipProps {
  category: AqiCategory;  // Current AQI category
}
```

---

#### `forecast-chart.tsx`
Visualizes AQI forecast data (future enhancement).

---

### UI Components (`/components/ui/`)

Generic reusable UI components following the app's design system.

---

## Hooks Reference

### `useAqiData()`

The primary hook for managing MQTT connection and AQI data.

**Location:** `hooks/use-aqi-data.ts`

**Returns:**
```typescript
{
  data: AqiData | null;      // Current sensor data
  loading: boolean;          // Connection loading state
  error: string | null;      // Error message if any
  lastUpdated: Date | null;  // Timestamp of last data update
  isOffline: boolean;        // Offline/demo mode indicator
  refresh: () => void;       // Function to reconnect
}
```

**Usage:**
```tsx
const { data, loading, error, isOffline, refresh } = useAqiData();
```

**Configuration Constants:**
| Constant | Default | Description |
|----------|---------|-------------|
| `MQTT_BROKER_URL` | `ws://192.168.1.100:9001` | MQTT broker WebSocket URL |
| `MQTT_TOPIC` | `sensor/aqi` | Topic to subscribe to |
| `CONNECTION_TIMEOUT_MS` | `5000` | Timeout before fallback to demo |

---

### `getTimeSinceUpdate(lastUpdated: Date | null)`

Helper function to get human-readable time since last update.

**Returns:** `string` (e.g., "Just now", "2 mins ago", "1 hour ago")

---

### `useColorScheme()`

Hook for detecting system color scheme (light/dark mode).

**Location:** `hooks/use-color-scheme.ts`

---

### `useThemeColor()`

Hook for getting theme-appropriate colors.

**Location:** `hooks/use-theme-color.ts`

---

## Type Definitions

### `AqiData`
Main interface for sensor data.

```typescript
interface AqiData {
  device_id: string;      // Sensor device identifier
  timestamp: string;      // ISO 8601 timestamp
  pm1_0: number;          // PM1.0 concentration (µg/m³)
  pm2_5: number;          // PM2.5 concentration (µg/m³)
  pm4_0: number;          // PM4.0 concentration (µg/m³)
  pm10: number;           // PM10 concentration (µg/m³)
  voc_index: number;      // VOC Index (1-500)
  nox_index: number;      // NOx Index (1-500)
  temperature: number;    // Temperature (°C)
  humidity: number;       // Relative Humidity (%)
  aqi: number;            // Calculated AQI (0-500)
  aqi_category: AqiCategory;
}
```

### `AqiCategory`
Union type for AQI categories.

```typescript
type AqiCategory = 
  | 'good' 
  | 'moderate' 
  | 'unhealthy_sensitive' 
  | 'unhealthy' 
  | 'very_unhealthy' 
  | 'hazardous';
```

### `AqiState`
State interface for the useAqiData hook.

```typescript
interface AqiState {
  data: AqiData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOffline: boolean;
}
```

---

## Theming System

### Color Constants (`constants/theme.ts`)

The app uses a centralized theming system:

```typescript
// AQI Category Colors
const AQI_COLORS = {
  good: '#22C55E',              // Green
  moderate: '#EAB308',          // Yellow
  unhealthy_sensitive: '#F97316', // Orange
  unhealthy: '#EF4444',         // Red
  very_unhealthy: '#A855F7',    // Purple
  hazardous: '#7C2D12',         // Maroon
};

// App Colors
const AqiColors = {
  background: '#0F0F0F',        // Dark background
  surface: '#1A1A1A',           // Card surfaces
  textPrimary: '#FFFFFF',       // Primary text
  textSecondary: '#9CA3AF',     // Secondary text
  accent: '#3B82F6',            // Accent color
};
```

---

## MQTT Protocol

### Connection Setup

The app uses WebSocket-based MQTT for browser/React Native compatibility:

```typescript
const client = mqtt.connect('ws://192.168.1.100:9001', {
  clientId: `aqi_app_${randomId}`,
  keepalive: 60,
  reconnectPeriod: 5000,
});
```

### Message Format

**Topic:** `sensor/aqi`

**Incoming JSON:**
```json
{
  "pm1": 12.5,
  "pm2_5": 25.4,
  "pm4": 30.1,
  "pm10": 45.2,
  "temp": 24.5,
  "rh": 52.0,
  "voc": 120,
  "nox": 15,
  "aqi": 78
}
```

### Broker Requirements

| Setting | Requirement |
|---------|-------------|
| Protocol | WebSocket (ws:// or wss://) |
| Default Port | 9001 (Mosquitto WebSocket) |
| Authentication | Optional (configure in mqtt.connect options) |

### Mosquitto Configuration Example

Add to `mosquitto.conf`:
```
listener 9001
protocol websockets
allow_anonymous true
```

---

## Troubleshooting

### Common Issues

#### App shows "Demo Data"
- **Cause:** Cannot connect to MQTT broker
- **Solution:** 
  1. Check `MQTT_BROKER_URL` in `use-aqi-data.ts`
  2. Ensure broker is running and accessible
  3. Verify WebSocket port is open (default: 9001)
  4. Check firewall settings

#### "Connection Error" message
- **Cause:** Network or broker issues
- **Solution:**
  1. Verify device is on same network as broker
  2. Test broker connectivity with MQTT client
  3. Check broker logs for connection attempts

#### Metrics not updating
- **Cause:** Sensor not publishing or wrong topic
- **Solution:**
  1. Verify sensor is publishing to `sensor/aqi`
  2. Check message format matches expected schema
  3. Monitor broker for incoming messages

#### Build/compile errors
- **Solution:**
  ```bash
  rm -rf node_modules
  npm install
  npx expo start -c  # Clear cache
  ```

---

## Development Tips

### Adding New Metrics

1. Update `AqiData` interface in `types/aqi.ts`
2. Add mapping in `use-aqi-data.ts` message handler
3. Create new `MetricCard` in `app/(tabs)/index.tsx`

### Changing MQTT Broker

Update in `hooks/use-aqi-data.ts`:
```typescript
const MQTT_BROKER_URL = 'ws://your-broker-ip:port';
```

### Testing Without Sensor

The app automatically falls back to demo data. To force demo mode:
1. Set `MQTT_BROKER_URL` to an invalid address
2. Wait for 5-second timeout

---

## Future Enhancements

- [ ] Historical data charts
- [ ] Push notifications for unhealthy AQI
- [ ] Multiple sensor support
- [ ] Location-based outdoor AQI comparison
- [ ] Export data to CSV
- [ ] Calibration settings
