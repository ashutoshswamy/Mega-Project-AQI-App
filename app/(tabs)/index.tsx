import { AqiGauge, ForecastChart, HealthTip, MetricCard } from '@/components/aqi';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AqiColors } from '@/constants/theme';
import { getTimeSinceUpdate, useAqiData } from '@/hooks/use-aqi-data';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Metric icons as simple components
const MetricIcon = ({ name, color = AqiColors.accent }: { name: string; color?: string }) => (
  <IconSymbol name={name as any} size={16} color={color} />
);

export default function HomeScreen() {
  const { data, loading, error, isOffline, lastUpdated, refresh } = useAqiData();

  // Loading state
  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={AqiColors.accent} />
          <Text style={styles.loadingText}>Connecting to sensor...</Text>
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

  const timeSince = getTimeSinceUpdate(lastUpdated);

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <IconSymbol name="line.3.horizontal" size={24} color={AqiColors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>CURRENT LOCATION ▾</Text>
            <Text style={styles.locationName}>San Francisco, CA</Text>
          </View>
          
          <TouchableOpacity style={styles.bellButton}>
            <IconSymbol name="bell.fill" size={22} color={AqiColors.accent} />
          </TouchableOpacity>
        </View>

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
            <Text style={styles.offlineText}>⚡ Offline - Showing last known data</Text>
          </View>
        )}

        {/* Detailed Metrics */}
        <Text style={styles.sectionTitle}>DETAILED METRICS</Text>
        
        {data && (
          <View style={styles.metricsGrid}>
            {/* Row 1 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<MetricIcon name="aqi.medium" />}
                label="PM1.0"
                value={data.pm1_0.toFixed(1)}
                unit="µg/m³"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<MetricIcon name="aqi.medium" />}
                label="PM2.5"
                value={data.pm2_5.toFixed(1)}
                unit="µg/m³"
              />
            </View>

            {/* Row 2 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<MetricIcon name="aqi.medium" />}
                label="PM4.0"
                value={data.pm4_0.toFixed(1)}
                unit="µg/m³"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<MetricIcon name="aqi.medium" />}
                label="PM10"
                value={data.pm10.toFixed(1)}
                unit="µg/m³"
              />
            </View>

            {/* Row 3 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<MetricIcon name="flame.fill" color="#F97316" />}
                label="VOC"
                value={Math.round(data.voc_index)}
                unit="Index"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<MetricIcon name="cloud.fill" color="#EAB308" />}
                label="NOX"
                value={Math.round(data.nox_index)}
                unit="Index"
              />
            </View>

            {/* Row 4 */}
            <View style={styles.metricsRow}>
              <MetricCard
                icon={<MetricIcon name="drop.fill" color="#3B82F6" />}
                label="HUMIDITY"
                value={Math.round(data.humidity)}
                unit="%"
              />
              <View style={styles.metricGap} />
              <MetricCard
                icon={<MetricIcon name="thermometer.medium" color="#EF4444" />}
                label="TEMP"
                value={data.temperature.toFixed(1)}
                unit="°C"
              />
            </View>
          </View>
        )}

        {/* 24H Forecast */}
        <ForecastChart />

        {/* Health Tip */}
        {data && <HealthTip category={data.aqi_category} />}

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: AqiColors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: AqiColors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: AqiColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: AqiColors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
  },
  locationContainer: {
    alignItems: 'center',
  },
  locationLabel: {
    color: AqiColors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationName: {
    color: AqiColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  bellButton: {
    padding: 8,
  },
  offlineBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#EAB308',
    fontSize: 13,
  },
  sectionTitle: {
    color: AqiColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
  },
  metricGap: {
    width: 12,
  },
});
