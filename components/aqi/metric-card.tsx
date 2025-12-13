import { AqiColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
}

export function MetricCard({ icon, label, value, unit }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AqiColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AqiColors.cardBorder,
    flex: 1,
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: AqiColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    color: AqiColors.textPrimary,
    fontSize: 28,
    fontWeight: '300',
  },
  unit: {
    color: AqiColors.textMuted,
    fontSize: 14,
  },
});
