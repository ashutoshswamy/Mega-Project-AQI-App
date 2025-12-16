# AQI App 🌿

A real-time **Air Quality Index (AQI) Monitoring** mobile application built with React Native and Expo. The app connects to a **Sensirion SEN55** environmental sensor via MQTT to display live air quality data.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![MQTT](https://img.shields.io/badge/MQTT-5.x-660066)

---

## 📱 Features

- **Real-time AQI Monitoring** - Live Air Quality Index with color-coded categories
- **Comprehensive Metrics** - PM1.0, PM2.5, PM4.0, PM10, VOC, NOx, Temperature, Humidity
- **Visual AQI Gauge** - Beautiful circular gauge with glowing effects and animated transitions
- **Health Tips** - Context-aware health recommendations based on current AQI
- **Live Updates** - Real-time "time since update" display that refreshes every second
- **Offline Support** - Fallback to demo data when sensor isn't available
- **Dark Mode** - Elegant dark theme with green accents
- **Cross-platform** - Works on iOS, Android, and Web

---

## 🏗️ Project Structure

```
aqi-app/
├── app/                      # Expo Router pages
│   ├── (tabs)/               # Tab-based navigation
│   │   ├── _layout.tsx       # Tab navigation layout
│   │   ├── index.tsx         # Home screen - AQI Dashboard
│   │   └── settings.tsx      # Settings screen
│   └── _layout.tsx           # Root layout with welcome screen
├── components/
│   ├── aqi/                  # AQI-specific components
│   │   ├── index.ts          # Barrel exports
│   │   ├── aqi-gauge.tsx     # Circular AQI gauge component
│   │   └── metric-card.tsx   # Individual metric display card
│   ├── haptic-tab.tsx        # Haptic feedback tab button
│   └── welcome-screen.tsx    # App welcome/splash screen
├── hooks/
│   ├── use-aqi-data.ts       # MQTT connection & data hook
│   └── use-color-scheme.ts   # Theme detection hook (+ .web.ts)
├── types/
│   └── aqi.ts                # TypeScript interfaces & constants
├── constants/
│   └── theme.ts              # Theme constants & AQI colors
└── assets/
    └── images/               # App icons and splash images
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Expo CLI** (optional, but recommended)
- **Expo Go** app on your mobile device for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aqi-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - Scan the QR code with **Expo Go** (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator, `w` for web

---

## ⚙️ Configuration

### MQTT Broker Setup

The app connects to an MQTT broker to receive sensor data. Update the broker URL in `hooks/use-aqi-data.ts`:

```typescript
const MQTT_BROKER_URL = 'ws://192.168.1.100:9001';  // Your broker IP
const MQTT_TOPIC = 'sensor/aqi';
```

> **Note:** The app uses WebSocket protocol (`ws://` or `wss://`) for MQTT connections, as standard MQTT ports don't work in React Native/browser environments.

### Expected Sensor Data Format

The app expects JSON messages on the `sensor/aqi` topic with this structure:

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

---

## 📊 AQI Categories

The app uses EPA-standard AQI categories:

| AQI Range | Category | Color | Health Implication |
|-----------|----------|-------|-------------------|
| 0-50 | Good | 🟢 Green | Air quality is satisfactory |
| 51-100 | Moderate | 🟡 Yellow | Acceptable for most |
| 101-150 | Unhealthy for Sensitive Groups | 🟠 Orange | Sensitive groups at risk |
| 151-200 | Unhealthy | 🔴 Red | Everyone may experience effects |
| 201-300 | Very Unhealthy | 🟣 Purple | Health alert |
| 301+ | Hazardous | 🟤 Maroon | Health emergency |

---

## 🔧 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Start** | `npm start` | Start Expo development server |
| **Android** | `npm run android` | Run on Android device/emulator |
| **iOS** | `npm run ios` | Run on iOS simulator |
| **Web** | `npm run web` | Run in web browser |
| **Lint** | `npm run lint` | Run ESLint code checks |
| **Reset** | `npm run reset-project` | Reset to fresh project state |

---

## 📦 Building for Production

### Android APK (using EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

### iOS (requires Apple Developer Account)

```bash
eas build -p ios --profile preview
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native 0.81** | Cross-platform mobile framework |
| **Expo 54** | Development toolkit & managed workflow |
| **TypeScript 5.9** | Type-safe JavaScript |
| **Expo Router 6** | File-based navigation |
| **MQTT.js 5.14** | Real-time sensor communication |
| **Lucide Icons** | Modern icon library |
| **React Native Reanimated 4.1** | Smooth animations |
| **Poppins Font** | Custom typography |

---

## 🔌 Hardware Integration

This app is designed to work with the **Sensirion SEN55** environmental sensor:

### Measured Parameters
- **PM1.0, PM2.5, PM4.0, PM10** - Particulate matter concentrations
- **VOC Index** - Volatile organic compounds (1-500 scale)
- **NOx Index** - Nitrogen oxides (1-500 scale)
- **Temperature** - Ambient temperature (°C)
- **Humidity** - Relative humidity (%)

### Communication Flow
```
SEN55 Sensor → ESP32/MCU → MQTT Broker → WebSocket → AQI App
```

---

## 📁 Key Files Reference

| File | Description |
|------|-------------|
| `hooks/use-aqi-data.ts` | Main MQTT connection hook, data fetching, offline fallback |
| `types/aqi.ts` | TypeScript interfaces for AQI data, categories, colors |
| `components/aqi/aqi-gauge.tsx` | Visual circular gauge component with glow effects |
| `components/aqi/metric-card.tsx` | Individual metric display cards |
| `components/welcome-screen.tsx` | App welcome screen with animations |
| `app/(tabs)/index.tsx` | Home screen with dashboard layout |
| `constants/theme.ts` | App-wide color theme definitions |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of an academic mega project. Please check with the authors for licensing information.

---

## 👥 Authors

- **Ashutosh Swamy**
- **Shlok Parge**
- **Aaryan Sharma**
- **Naman Vangani**

---

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - For the amazing development experience
- [Sensirion](https://sensirion.com/) - For the SEN55 sensor documentation
- [MQTT.js](https://github.com/mqttjs/MQTT.js) - For reliable MQTT connectivity
