/*
 * ESP32 Air Quality Monitor - HTTP Server (ESP-IDF)
 * Sensor: Sensirion SEN55
 * 
 * Based on: https://github.com/cl12121/aqi-sen55-impl
 * Modified: Replaced MQTT with HTTP REST API
 * 
 * Exposes GET /aqi endpoint returning JSON with all sensor readings
 */

#include <stdio.h>
#include <string.h>
#include <time.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_http_server.h"
#include "esp_sntp.h"
#include "lwip/err.h"
#include "lwip/sys.h"

// SEN5x driver includes
#include "sensirion_i2c_hal.h"
#include "sen5x_i2c.h"

// ============ CONFIGURATION ============
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASS           "YOUR_WIFI_PASSWORD"
#define DEVICE_ID           "esp32-aqi-001"
#define SENSOR_POLL_DELAY_MS 1000

static const char *TAG = "AQI_HTTP";

#define WIFI_CONNECTED_BIT BIT0
static EventGroupHandle_t wifi_event_group;

// ============ SENSOR DATA (thread-safe) ============
typedef struct {
    float pm1_0;
    float pm2_5;
    float pm4_0;
    float pm10;
    float temperature;
    float humidity;
    float voc_index;
    float nox_index;
    int aqi;
    bool valid;
    time_t timestamp;
} sensor_data_t;

static sensor_data_t g_sensor_data = {0};
static SemaphoreHandle_t g_sensor_mutex = NULL;

// ============ AQI CALCULATION ============
typedef struct {
    float conc_lo;
    float conc_hi;
    int aqi_lo;
    int aqi_hi;
} aqi_breakpoint_t;

// EPA breakpoints for PM2.5 (µg/m³)
static const aqi_breakpoint_t pm25_breakpoints[] = {
    {   0.0f,   12.0f,   0,  50 },
    {  12.1f,   35.4f,  51, 100 },
    {  35.5f,   55.4f, 101, 150 },
    {  55.5f,  150.4f, 151, 200 },
    { 150.5f,  250.4f, 201, 300 },
    { 250.5f,  350.4f, 301, 400 },
    { 350.5f,  500.4f, 401, 500 }
};

// EPA breakpoints for PM10 (µg/m³)
static const aqi_breakpoint_t pm10_breakpoints[] = {
    {    0.0f,   54.0f,   0,  50 },
    {   55.0f,  154.0f,  51, 100 },
    {  155.0f,  254.0f, 101, 150 },
    {  255.0f,  354.0f, 151, 200 },
    {  355.0f,  424.0f, 201, 300 },
    {  425.0f,  504.0f, 301, 400 },
    {  505.0f,  604.0f, 401, 500 }
};

// EPA breakpoints for NO2 (proxy for NOx) in ppb
static const aqi_breakpoint_t nox_breakpoints[] = {
    {    0.0f,   53.0f,   0,  50 },
    {   54.0f,  100.0f,  51, 100 },
    {  101.0f,  360.0f, 101, 150 },
    {  361.0f,  649.0f, 151, 200 },
    {  650.0f, 1249.0f, 201, 300 },
    { 1250.0f, 1649.0f, 301, 400 },
    { 1650.0f, 2049.0f, 401, 500 }
};

static int calculate_aqi(float conc, const aqi_breakpoint_t *bps, int len) {
    for (int i = 0; i < len; i++) {
        if (conc >= bps[i].conc_lo && conc <= bps[i].conc_hi) {
            float c_low = bps[i].conc_lo;
            float c_high = bps[i].conc_hi;
            int i_low = bps[i].aqi_lo;
            int i_high = bps[i].aqi_hi;
            float aqi = ((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low;
            return (int)(aqi + 0.5f);
        }
    }
    return 500; // Max if beyond scale
}

static const char* get_aqi_category(int aqi) {
    if (aqi <= 50) return "good";
    if (aqi <= 100) return "moderate";
    if (aqi <= 150) return "unhealthy_sensitive";
    if (aqi <= 200) return "unhealthy";
    if (aqi <= 300) return "very_unhealthy";
    return "hazardous";
}

// ============ WIFI ============
static void wifi_event_handler(void* arg, esp_event_base_t eb, int32_t id, void* data) {
    if (eb == WIFI_EVENT && id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (eb == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGW(TAG, "Wi-Fi disconnected, reconnecting...");
        esp_wifi_connect();
    } else if (eb == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* e = data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&e->ip_info.ip));
        xEventGroupSetBits(wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

static void wifi_init(void) {
    wifi_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();
    
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, wifi_event_handler, NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, wifi_event_handler, NULL));
    
    wifi_config_t wcfg = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASS,
            .threshold.authmode = WIFI_AUTH_WPA2_PSK
        }
    };
    
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wcfg));
    ESP_ERROR_CHECK(esp_wifi_start());
    
    ESP_LOGI(TAG, "Wi-Fi started, waiting for IP...");
    xEventGroupWaitBits(wifi_event_group, WIFI_CONNECTED_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
}

// ============ SNTP (for timestamps) ============
static void sntp_init_time(void) {
    ESP_LOGI(TAG, "Initializing SNTP");
    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, "pool.ntp.org");
    esp_sntp_init();
    
    // Wait for time sync (max 10 seconds)
    int retry = 0;
    while (sntp_get_sync_status() == SNTP_SYNC_STATUS_RESET && retry < 10) {
        ESP_LOGI(TAG, "Waiting for time sync... (%d)", retry);
        vTaskDelay(pdMS_TO_TICKS(1000));
        retry++;
    }
    
    // Set timezone to IST (UTC+5:30)
    setenv("TZ", "IST-5:30", 1);
    tzset();
}

// ============ HTTP SERVER ============
static esp_err_t aqi_get_handler(httpd_req_t *req) {
    static char json_buffer[512];
    char timestamp[32];
    
    // Get current timestamp
    time_t now;
    struct tm timeinfo;
    time(&now);
    gmtime_r(&now, &timeinfo);
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    
    // Read sensor data thread-safely
    sensor_data_t data;
    if (xSemaphoreTake(g_sensor_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        data = g_sensor_data;
        xSemaphoreGive(g_sensor_mutex);
    } else {
        httpd_resp_set_status(req, "503 Service Unavailable");
        httpd_resp_set_type(req, "application/json");
        httpd_resp_sendstr(req, "{\"error\":\"Sensor data unavailable\"}");
        return ESP_OK;
    }
    
    if (!data.valid) {
        httpd_resp_set_status(req, "503 Service Unavailable");
        httpd_resp_set_type(req, "application/json");
        httpd_resp_sendstr(req, "{\"error\":\"Sensor not ready\"}");
        return ESP_OK;
    }
    
    const char* category = get_aqi_category(data.aqi);
    
    // Build JSON response
    snprintf(json_buffer, sizeof(json_buffer),
        "{"
        "\"device_id\":\"%s\","
        "\"timestamp\":\"%s\","
        "\"pm1_0\":%.1f,"
        "\"pm2_5\":%.1f,"
        "\"pm4_0\":%.1f,"
        "\"pm10\":%.1f,"
        "\"voc_index\":%.1f,"
        "\"nox_index\":%.1f,"
        "\"temperature\":%.1f,"
        "\"humidity\":%.1f,"
        "\"aqi\":%d,"
        "\"aqi_category\":\"%s\""
        "}",
        DEVICE_ID, timestamp,
        data.pm1_0, data.pm2_5, data.pm4_0, data.pm10,
        data.voc_index, data.nox_index,
        data.temperature, data.humidity,
        data.aqi, category
    );
    
    // Set CORS headers
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, json_buffer);
    
    return ESP_OK;
}

static esp_err_t cors_options_handler(httpd_req_t *req) {
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
    httpd_resp_set_status(req, "204 No Content");
    httpd_resp_send(req, NULL, 0);
    return ESP_OK;
}

static esp_err_t root_get_handler(httpd_req_t *req) {
    httpd_resp_set_type(req, "text/plain");
    httpd_resp_sendstr(req, "ESP32 AQI Monitor - GET /aqi for data");
    return ESP_OK;
}

static httpd_handle_t start_webserver(void) {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.stack_size = 8192;
    
    httpd_handle_t server = NULL;
    
    if (httpd_start(&server, &config) == ESP_OK) {
        httpd_uri_t root_uri = {
            .uri = "/",
            .method = HTTP_GET,
            .handler = root_get_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server, &root_uri);
        
        httpd_uri_t aqi_uri = {
            .uri = "/aqi",
            .method = HTTP_GET,
            .handler = aqi_get_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server, &aqi_uri);
        
        httpd_uri_t cors_uri = {
            .uri = "/aqi",
            .method = HTTP_OPTIONS,
            .handler = cors_options_handler,
            .user_ctx = NULL
        };
        httpd_register_uri_handler(server, &cors_uri);
        
        ESP_LOGI(TAG, "HTTP server started on port 80");
        ESP_LOGI(TAG, "Endpoint: GET /aqi");
    }
    
    return server;
}

// ============ SENSOR TASK ============
static void sensor_task(void *pvParameters) {
    sensirion_i2c_hal_init();
    
    ESP_LOGI(TAG, "Starting SEN5x measurement...");
    if (sen5x_start_measurement() != 0) {
        ESP_LOGE(TAG, "Failed to start measurement");
        vTaskDelete(NULL);
        return;
    }
    
    vTaskDelay(pdMS_TO_TICKS(1000));
    
    while (1) {
        bool ready = false;
        if (sen5x_read_data_ready(&ready) != 0) {
            ESP_LOGE(TAG, "Data-ready check failed");
        } else if (ready) {
            uint16_t pm1p0, pm2p5, pm4p0, pm10p0;
            int16_t hum, temp_raw, voc_idx, nox_idx;
            
            if (sen5x_read_measured_values(&pm1p0, &pm2p5, &pm4p0, &pm10p0, 
                                           &hum, &temp_raw, &voc_idx, &nox_idx) == 0) {
                // Convert raw values
                float pm1 = pm1p0 / 10.0f;
                float pm2_5 = pm2p5 / 10.0f;
                float pm4 = pm4p0 / 10.0f;
                float pm10 = pm10p0 / 10.0f;
                float temp = temp_raw / 200.0f;
                float rh = hum / 100.0f;
                float voc = voc_idx / 10.0f;
                float nox = nox_idx / 10.0f;
                
                // Calculate AQI (max of PM2.5, PM10, NOx)
                int aqi25 = calculate_aqi(pm2_5, pm25_breakpoints, 
                    sizeof(pm25_breakpoints)/sizeof(pm25_breakpoints[0]));
                int aqi10 = calculate_aqi(pm10, pm10_breakpoints, 
                    sizeof(pm10_breakpoints)/sizeof(pm10_breakpoints[0]));
                int aqi_nox = calculate_aqi(nox, nox_breakpoints, 
                    sizeof(nox_breakpoints)/sizeof(nox_breakpoints[0]));
                int aqi = aqi25;
                if (aqi10 > aqi) aqi = aqi10;
                if (aqi_nox > aqi) aqi = aqi_nox;
                
                ESP_LOGI(TAG, "PM1:%.1f PM2.5:%.1f PM4:%.1f PM10:%.1f Temp:%.2f°C RH:%.2f%% VOC:%.1f NOx:%.1f AQI:%d",
                         pm1, pm2_5, pm4, pm10, temp, rh, voc, nox, aqi);
                
                // Update global sensor data thread-safely
                if (xSemaphoreTake(g_sensor_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
                    g_sensor_data.pm1_0 = pm1;
                    g_sensor_data.pm2_5 = pm2_5;
                    g_sensor_data.pm4_0 = pm4;
                    g_sensor_data.pm10 = pm10;
                    g_sensor_data.temperature = temp;
                    g_sensor_data.humidity = rh;
                    g_sensor_data.voc_index = voc;
                    g_sensor_data.nox_index = nox;
                    g_sensor_data.aqi = aqi;
                    g_sensor_data.valid = true;
                    time(&g_sensor_data.timestamp);
                    xSemaphoreGive(g_sensor_mutex);
                }
            } else {
                ESP_LOGE(TAG, "Failed to read sensor values");
            }
        } else {
            ESP_LOGW(TAG, "Data not ready");
        }
        
        vTaskDelay(pdMS_TO_TICKS(SENSOR_POLL_DELAY_MS));
    }
}

// ============ MAIN ============
void app_main(void) {
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);
    
    // Create mutex for sensor data
    g_sensor_mutex = xSemaphoreCreateMutex();
    
    // Initialize Wi-Fi
    wifi_init();
    
    // Initialize SNTP for timestamps
    sntp_init_time();
    
    // Start HTTP server
    start_webserver();
    
    // Start sensor reading task
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
    
    ESP_LOGI(TAG, "AQI HTTP Server ready!");
}
