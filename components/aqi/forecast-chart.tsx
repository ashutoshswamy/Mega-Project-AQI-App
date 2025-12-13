import { AqiColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ForecastChartProps {
  currentHour?: number;
}

// Mock forecast data - in production this would come from historical data
const FORECAST_DATA = [
  { hour: '12p', level: 0.3 },
  { hour: '2p', level: 0.4 },
  { hour: '4p', level: 0.5 },
  { hour: '6p', level: 0.6 },
  { hour: '8p', level: 0.4 },
  { hour: 'Now', level: 0.3, isCurrent: true },
  { hour: '12a', level: 0.2 },
];

const getBarColor = (level: number): string => {
  if (level <= 0.3) return '#22C55E';
  if (level <= 0.5) return '#84CC16';
  if (level <= 0.7) return '#EAB308';
  return '#F97316';
};

export function ForecastChart({ currentHour }: ForecastChartProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>24H FORECAST</Text>
        <TouchableOpacity>
          <Text style={styles.seeDetails}>See Details</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.chartContainer}>
        {FORECAST_DATA.map((item, index) => (
          <View key={index} style={styles.barColumn}>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${item.level * 100}%`,
                    backgroundColor: getBarColor(item.level),
                  },
                ]}
              />
            </View>
            <Text style={[styles.hourLabel, item.isCurrent && styles.currentLabel]}>
              {item.hour}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: AqiColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },
  seeDetails: {
    color: AqiColors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 80,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barBackground: {
    width: 12,
    height: 60,
    backgroundColor: AqiColors.card,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  hourLabel: {
    color: AqiColors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  currentLabel: {
    color: AqiColors.textPrimary,
    fontWeight: '600',
  },
});
