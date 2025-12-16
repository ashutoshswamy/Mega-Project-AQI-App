import { AqiColors, PoppinsFonts } from '@/constants/theme';
import React from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [espIp, setEspIp] = React.useState('192.168.1.100');

  const handleSave = () => {
    Alert.alert('Settings Saved', `ESP32 IP: ${espIp}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESP32 CONNECTION</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Device IP Address</Text>
            <TextInput
              style={styles.input}
              value={espIp}
              onChangeText={setEspIp}
              placeholder="192.168.1.100"
              placeholderTextColor={AqiColors.textMuted}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
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
    marginBottom: 16,
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
  saveButton: {
    backgroundColor: AqiColors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
