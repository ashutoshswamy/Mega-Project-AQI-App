import { AqiColors, PoppinsFonts } from '@/constants/theme';
import { useMqttSettings } from '@/hooks/use-mqtt-settings';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { settings, isLoading, isSaving, updateSetting, save, resetToDefaults } = useMqttSettings();

  const handleSave = async () => {
    const success = await save();
    if (success) {
      Alert.alert('Settings Saved', 'MQTT configuration has been updated. The app will use these settings on next connection.');
    } else {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset MQTT settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Reset Complete', 'Settings have been reset to defaults. Tap Save to apply.');
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AqiColors.accent} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MQTT CONNECTION</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Broker URL</Text>
            <TextInput
              style={styles.input}
              value={settings.brokerUrl}
              onChangeText={(value) => updateSetting('brokerUrl', value)}
              placeholder="wss://broker.hivemq.com:8884/mqtt"
              placeholderTextColor={AqiColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>WebSocket URL (ws:// or wss://)</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Topic</Text>
            <TextInput
              style={styles.input}
              value={settings.topic}
              onChangeText={(value) => updateSetting('topic', value)}
              placeholder="sensor/aqi"
              placeholderTextColor={AqiColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>MQTT topic to subscribe to</Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
              disabled={isSaving}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <Text style={styles.aboutText}>AQI Monitor v1.0.0</Text>
          <Text style={styles.aboutSubtext}>ESP32 + SEN55 Sensor</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AqiColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: AqiColors.textSecondary,
    marginTop: 12,
    fontSize: 14,
    fontFamily: PoppinsFonts.regular,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    color: AqiColors.textPrimary,
    fontSize: 28,
    fontFamily: PoppinsFonts.semiBold,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: AqiColors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: PoppinsFonts.semiBold,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: AqiColors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: PoppinsFonts.regular,
  },
  input: {
    backgroundColor: AqiColors.card,
    borderRadius: 12,
    padding: 16,
    color: AqiColors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: AqiColors.cardBorder,
    fontFamily: PoppinsFonts.regular,
  },
  hint: {
    color: AqiColors.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontFamily: PoppinsFonts.regular,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AqiColors.cardBorder,
  },
  resetButtonText: {
    color: AqiColors.textSecondary,
    fontSize: 16,
    fontFamily: PoppinsFonts.semiBold,
  },
  saveButton: {
    flex: 2,
    backgroundColor: AqiColors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: PoppinsFonts.semiBold,
  },
  aboutText: {
    color: AqiColors.textPrimary,
    fontSize: 16,
    marginBottom: 4,
    fontFamily: PoppinsFonts.regular,
  },
  aboutSubtext: {
    color: AqiColors.textMuted,
    fontSize: 14,
    fontFamily: PoppinsFonts.regular,
  },
});
