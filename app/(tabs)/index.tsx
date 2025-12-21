import { AqiGauge, MetricCard } from "@/components/aqi";
import { AqiColors, PoppinsFonts } from "@/constants/theme";
import { getTimeSinceUpdate, useAqiData } from "@/hooks/use-aqi-data";
import {
  DEFAULT_MQTT_BROKER_URL,
  DEFAULT_MQTT_PORT,
  DEFAULT_MQTT_TOPIC,
  useMqttSettings,
} from "@/hooks/use-mqtt-settings";
import { Cloud, Droplets, Flame, Thermometer, Wind } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { settings, isLoading: isLoadingSettings } = useMqttSettings();

  // Use settings or defaults while loading
  const brokerUrl = isLoadingSettings
    ? DEFAULT_MQTT_BROKER_URL
    : settings.brokerUrl;
  const port = isLoadingSettings ? DEFAULT_MQTT_PORT : settings.port;
  const topic = isLoadingSettings ? DEFAULT_MQTT_TOPIC : settings.topic;

  const { data, loading, error, isOffline, lastUpdated, isConnected, refresh } =
    useAqiData({ brokerUrl, port, topic });
  const [timeSince, setTimeSince] = useState("Never");

  // Update time since every second for live display
  useEffect(() => {
    const updateTime = () => setTimeSince(getTimeSinceUpdate(lastUpdated));
    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Loading state - also show when loading settings
  if ((loading || isLoadingSettings) && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={AqiColors.accent} />
          <Text style={styles.loadingText}>
            {isLoadingSettings
              ? "Loading settings..."
              : "Connecting to sensor..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Offline state with stale data
  if (isOffline && data) {
    // Show data with offline indicator
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={AqiColors.accent}
          />
        }
      >
        {/* AQI Gauge */}
        {data && (
          <AqiGauge
            aqi={data.aqi}
            category={data.aqi_category}
            lastUpdated={timeSince}
          />
        )}

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              ⚡ Offline - Showing last known data
            </Text>
          </View>
        )}

        {/* Detailed Metrics */}
        <Text style={styles.sectionTitle}>DETAILED METRICS</Text>

        {data && (
          <View style={styles.metricsGrid}>
            {/* Row 1 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<Wind size={16} color={AqiColors.accent} />}
                label="PM1.0"
                value={data.pm1_0.toFixed(1)}
                unit="µg/m³"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<Wind size={16} color={AqiColors.accent} />}
                label="PM2.5"
                value={data.pm2_5.toFixed(1)}
                unit="µg/m³"
              />
            </View>

            {/* Row 2 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<Wind size={16} color={AqiColors.accent} />}
                label="PM4.0"
                value={data.pm4_0.toFixed(1)}
                unit="µg/m³"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<Wind size={16} color={AqiColors.accent} />}
                label="PM10"
                value={data.pm10.toFixed(1)}
                unit="µg/m³"
              />
            </View>

            {/* Row 3 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<Flame size={16} color="#F97316" />}
                label="VOC"
                value={Math.round(data.voc_index)}
                unit="Index"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<Cloud size={16} color="#EAB308" />}
                label="NOX"
                value={Math.round(data.nox_index)}
                unit="Index"
              />
            </View>

            {/* Row 4 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<Droplets size={16} color="#3B82F6" />}
                label="HUMIDITY"
                value={Math.round(data.humidity)}
                unit="%"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<Thermometer size={16} color="#EF4444" />}
                label="TEMP"
                value={data.temperature.toFixed(1)}
                unit="°C"
              />
            </View>
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AqiColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    color: AqiColors.textSecondary,
    marginTop: 16,
    fontSize: 16,
    fontFamily: PoppinsFonts.regular,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: AqiColors.textPrimary,
    fontSize: 20,
    fontFamily: PoppinsFonts.semiBold,
    marginBottom: 8,
  },
  errorText: {
    color: AqiColors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: PoppinsFonts.regular,
  },
  retryButton: {
    backgroundColor: AqiColors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "#000",
    fontFamily: PoppinsFonts.semiBold,
    fontSize: 16,
  },

  offlineBanner: {
    backgroundColor: "rgba(234, 179, 8, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  offlineText: {
    color: "#EAB308",
    fontSize: 13,
    fontFamily: PoppinsFonts.regular,
  },
  sectionTitle: {
    color: AqiColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: PoppinsFonts.semiBold,
    marginTop: 24,
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: "row",
  },
  metricGap: {
    width: 12,
  },
});
