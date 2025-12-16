import { AqiColors, PoppinsFonts } from '@/constants/theme';
import { AQI_COLORS, AQI_LABELS, AqiCategory } from '@/types/aqi';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AqiGaugeProps {
  aqi: number;
  category: AqiCategory;
  lastUpdated: string;
}

export function AqiGauge({ aqi, category, lastUpdated }: AqiGaugeProps) {
  const color = AQI_COLORS[category];
  const label = AQI_LABELS[category];

  return (
    <View style={styles.container}>
      {/* Glowing Circle with AQI */}
      <View style={styles.glowContainer}>
        {/* Outer glow ring */}
        <View style={[styles.glowRing, { borderColor: `${color}30` }]}>
          {/* Inner glow ring */}
          <View style={[styles.innerRing, { borderColor: `${color}50` }]}>
            {/* Center circle */}
            <View style={[styles.centerCircle, { backgroundColor: `${color}15`, borderColor: color }]}>
              <Text style={styles.aqiValue}>{aqi}</Text>
              <Text style={styles.aqiUnit}>AQI</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Label */}
      <View style={[styles.categoryPill, { backgroundColor: color }]}>
        <Text style={styles.categoryText}>{label}</Text>
      </View>

      {/* Scale Indicator */}
      <View style={styles.scaleContainer}>
        <View style={styles.scaleBar}>
          <View style={[styles.scaleSegment, { backgroundColor: '#22C55E' }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#84CC16' }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#EAB308' }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#F97316' }]} />
          <View style={[styles.scaleSegment, { backgroundColor: '#EF4444' }]} />
          <View style={[styles.scaleSegment, styles.lastSegment, { backgroundColor: '#7C2D12' }]} />
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>Good</Text>
          <Text style={styles.scaleLabel}>Hazardous</Text>
        </View>
      </View>

      {/* Updated Badge */}
      <View style={styles.updatedBadge}>
        <View style={styles.pulsingDot}>
          <View style={[styles.dotCore, { backgroundColor: color }]} />
        </View>
        <Text style={styles.updatedText}>Live • {lastUpdated}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  glowContainer: {
    marginBottom: 24,
  },
  glowRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aqiValue: {
    fontSize: 64,
    fontFamily: PoppinsFonts.semiBold,
    color: AqiColors.textPrimary,
    lineHeight: 72,
  },
  aqiUnit: {
    fontSize: 14,
    fontFamily: PoppinsFonts.medium,
    color: AqiColors.textMuted,
    letterSpacing: 3,
    marginTop: -4,
  },
  categoryPill: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 28,
  },
  categoryText: {
    fontSize: 18,
    fontFamily: PoppinsFonts.bold,
    color: '#000',
    letterSpacing: 0.5,
  },
  scaleContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scaleBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scaleSegment: {
    flex: 1,
  },
  lastSegment: {
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scaleLabel: {
    fontSize: 11,
    fontFamily: PoppinsFonts.regular,
    color: AqiColors.textMuted,
  },
  updatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AqiColors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AqiColors.cardBorder,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  updatedText: {
    fontSize: 13,
    fontFamily: PoppinsFonts.medium,
    color: AqiColors.textSecondary,
  },
});



