import { AqiColors, PoppinsFonts } from '@/constants/theme';
import { Leaf } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface WelcomeScreenProps {
  onFinish: () => void;
}

export function WelcomeScreen({ onFinish }: WelcomeScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleContinue = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconContainer}>
          <Leaf size={40} color={AqiColors.accent} strokeWidth={1.5} />
        </View>
        
        <Text style={styles.title}>AQI Monitoring System</Text>
        <Text style={styles.subtitle}>ESP32 | SEN55</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.projectLabel}>Project by:</Text>
        <Text style={styles.names}>
          Ashutosh Swamy, Shlok Parge,{'\n'}Aaryan Sharma, Naman Vangani
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AqiColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: AqiColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AqiColors.cardBorder,
  },
  title: {
    fontSize: 28,
    fontFamily: PoppinsFonts.bold,
    color: AqiColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: PoppinsFonts.medium,
    color: AqiColors.accent,
    textAlign: 'center',
    letterSpacing: 2,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: AqiColors.cardBorder,
    marginVertical: 32,
    borderRadius: 1,
  },
  projectLabel: {
    fontSize: 12,
    fontFamily: PoppinsFonts.regular,
    color: AqiColors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  names: {
    fontSize: 14,
    fontFamily: PoppinsFonts.medium,
    color: AqiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 48,
    backgroundColor: AqiColors.accent,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 28,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: PoppinsFonts.semiBold,
    color: '#000',
  },
});

