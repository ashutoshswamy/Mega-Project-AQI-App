import { AqiColors } from '@/constants/theme';
import { AQI_COLORS, AqiCategory, HEALTH_TIPS } from '@/types/aqi';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface HealthTipProps {
  category: AqiCategory;
}

export function HealthTip({ category }: HealthTipProps) {
  const tip = HEALTH_TIPS[category];
  const accentColor = AQI_COLORS[category];

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
          <Text style={styles.icon}>💡</Text>
        </View>
        <Text style={styles.title}>Health Tip</Text>
      </View>
      <Text style={styles.tip}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AqiColors.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  title: {
    color: AqiColors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  tip: {
    color: AqiColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
