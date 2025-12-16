import { AqiColors } from '@/constants/theme';
import { AQI_COLORS, AQI_LABELS, AqiCategory } from '@/types/aqi';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AqiGaugeProps {
  aqi: number;
  category: AqiCategory;
  lastUpdated: string;
}

export function AqiGauge({ aqi, category, lastUpdated }: AqiGaugeProps) {
  const color = AQI_COLORS[category];
  const label = AQI_LABELS[category];
  
  // Calculate arc progress (0-500 AQI scale)
  const progress = Math.min(aqi / 500, 1);
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const strokeDashoffset = arcLength * (1 - progress);
  
  // SVG arc path
  const startAngle = 135;
  const endAngle = 405;
  const centerX = 100;
  const centerY = 100;
  
  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };
  
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  
  const arcPath = `
    M ${start.x} ${start.y}
    A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.indexLabel}>AQI INDEX</Text>
      
      <View style={styles.gaugeContainer}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          {/* Background arc */}
          <Path
            d={arcPath}
            stroke={AqiColors.card}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <Path
            d={arcPath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${arcLength}`}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        
        <View style={styles.valueContainer}>
          <Text style={styles.aqiValue}>{aqi}</Text>
        </View>
      </View>
      
      <Text style={[styles.categoryLabel, { color }]}>{label}</Text>
      <Text style={styles.updatedLabel}>Updated {lastUpdated}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  indexLabel: {
    color: AqiColors.textSecondary,
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
  },
  gaugeContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aqiValue: {
    fontSize: 72,
    fontFamily: 'Poppins_300Light',
    color: AqiColors.textPrimary,
  },
  categoryLabel: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 10,
  },
  updatedLabel: {
    color: AqiColors.textMuted,
    fontSize: 12,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'Poppins_400Regular',
  },
});

