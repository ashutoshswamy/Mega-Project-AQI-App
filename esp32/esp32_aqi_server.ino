/*
 * ESP32 Air Quality Monitor - HTTP Server
 * Sensor: Sensirion SEN55
 * 
 * Exposes GET /aqi endpoint returning JSON with all sensor readings
 * 
 * Configuration:
 * - Update WIFI_SSID and WIFI_PASSWORD with your network credentials
 * - Default IP will be assigned by DHCP (printed to Serial)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <SensirionI2CSen5x.h>
#include <time.h>

// ============ CONFIGURATION ============
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* DEVICE_ID = "esp32-aqi-001";
const int HTTP_PORT = 80;

// NTP Configuration for timestamps
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 19800;  // IST +5:30
const int DAYLIGHT_OFFSET_SEC = 0;

// ============ GLOBALS ============
WebServer server(HTTP_PORT);
SensirionI2CSen5x sen5x;

// Sensor data structure
struct AqiData {
  float pm1_0;
  float pm2_5;
  float pm4_0;
  float pm10;
  float voc_index;
  float nox_index;
  float temperature;
  float humidity;
  bool valid;
};

AqiData sensorData = {0};
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_READ_INTERVAL = 1000;  // 1 second

// ============ AQI CALCULATION ============
// Simple AQI based on PM2.5 (EPA standard)
int calculateAQI(float pm25) {
  if (pm25 <= 12.0) return map(pm25 * 10, 0, 120, 0, 50);
  if (pm25 <= 35.4) return map(pm25 * 10, 121, 354, 51, 100);
  if (pm25 <= 55.4) return map(pm25 * 10, 355, 554, 101, 150);
  if (pm25 <= 150.4) return map(pm25 * 10, 555, 1504, 151, 200);
  if (pm25 <= 250.4) return map(pm25 * 10, 1505, 2504, 201, 300);
  return map(pm25 * 10, 2505, 5004, 301, 500);
}

const char* getAqiCategory(int aqi) {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthy_sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very_unhealthy";
  return "hazardous";
}

// ============ TIMESTAMP ============
void getISOTimestamp(char* buffer, size_t size) {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    snprintf(buffer, size, "1970-01-01T00:00:00Z");
    return;
  }
  strftime(buffer, size, "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
}

// ============ SENSOR READING ============
void readSensor() {
  uint16_t error;
  
  float massConcentrationPm1p0, massConcentrationPm2p5;
  float massConcentrationPm4p0, massConcentrationPm10p0;
  float ambientHumidity, ambientTemperature;
  float vocIndex, noxIndex;
  
  error = sen5x.readMeasuredValues(
    massConcentrationPm1p0, massConcentrationPm2p5,
    massConcentrationPm4p0, massConcentrationPm10p0,
    ambientHumidity, ambientTemperature,
    vocIndex, noxIndex
  );
  
  if (error) {
    sensorData.valid = false;
    Serial.print("Error reading SEN55: ");
    Serial.println(error);
    return;
  }
  
  sensorData.pm1_0 = massConcentrationPm1p0;
  sensorData.pm2_5 = massConcentrationPm2p5;
  sensorData.pm4_0 = massConcentrationPm4p0;
  sensorData.pm10 = massConcentrationPm10p0;
  sensorData.humidity = ambientHumidity;
  sensorData.temperature = ambientTemperature;
  sensorData.voc_index = vocIndex;
  sensorData.nox_index = noxIndex;
  sensorData.valid = true;
}

// ============ HTTP HANDLERS ============
void handleAqi() {
  if (!sensorData.valid) {
    server.send(503, "application/json", "{\"error\":\"Sensor data unavailable\"}");
    return;
  }
  
  char timestamp[30];
  getISOTimestamp(timestamp, sizeof(timestamp));
  
  int aqi = calculateAQI(sensorData.pm2_5);
  const char* category = getAqiCategory(aqi);
  
  // Build JSON response using static buffer (memory efficient)
  static char jsonBuffer[512];
  snprintf(jsonBuffer, sizeof(jsonBuffer),
    "{"
    "\"device_id\":\"%s\","
    "\"timestamp\":\"%s\","
    "\"pm1_0\":%.1f,"
    "\"pm2_5\":%.1f,"
    "\"pm4_0\":%.1f,"
    "\"pm10\":%.1f,"
    "\"voc_index\":%.0f,"
    "\"nox_index\":%.0f,"
    "\"temperature\":%.1f,"
    "\"humidity\":%.1f,"
    "\"aqi\":%d,"
    "\"aqi_category\":\"%s\""
    "}",
    DEVICE_ID, timestamp,
    sensorData.pm1_0, sensorData.pm2_5,
    sensorData.pm4_0, sensorData.pm10,
    sensorData.voc_index, sensorData.nox_index,
    sensorData.temperature, sensorData.humidity,
    aqi, category
  );
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", jsonBuffer);
}

void handleNotFound() {
  server.send(404, "application/json", "{\"error\":\"Not found\"}");
}

void handleRoot() {
  server.send(200, "text/plain", "ESP32 AQI Monitor - GET /aqi for data");
}

// ============ SETUP ============
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 AQI Monitor ===");
  
  // Initialize I2C for SEN55
  Wire.begin();
  sen5x.begin(Wire);
  
  // Reset and start SEN55
  uint16_t error = sen5x.deviceReset();
  if (error) {
    Serial.print("SEN55 reset error: ");
    Serial.println(error);
  }
  
  error = sen5x.startMeasurement();
  if (error) {
    Serial.print("SEN55 start error: ");
    Serial.println(error);
  }
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection failed! Restarting...");
    ESP.restart();
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize NTP
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  
  // Setup HTTP routes
  server.on("/", handleRoot);
  server.on("/aqi", HTTP_GET, handleAqi);
  server.onNotFound(handleNotFound);
  
  // Enable CORS preflight
  server.on("/aqi", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });
  
  server.begin();
  Serial.println("HTTP server started on port 80");
  Serial.println("Endpoint: GET /aqi");
}

// ============ LOOP ============
void loop() {
  // Handle HTTP requests (non-blocking)
  server.handleClient();
  
  // Read sensor at intervals (non-blocking)
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = currentMillis;
    readSensor();
  }
  
  // Small delay to prevent watchdog issues
  delay(1);
}
