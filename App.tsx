/**
 * AssetTracker - Main App Component
 * Production-ready asset tracking for aged care facilities
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme, darkTheme } from './src/theme';
import { initializeFirebase } from './src/firebase/config';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode] = useState(false); // Can be controlled by user settings

  useEffect(() => {
    // Initialize Firebase on app start
    const init = async () => {
      try {
        console.log('🚀 Initializing app...');
        console.log('Platform:', require('react-native').Platform.OS);
        
        initializeFirebase();
        
        console.log('✅ App initialized successfully');
        setLoading(false);
      } catch (err: any) {
        console.error('❌ App initialization failed:', err);
        setError(err.message || 'Failed to initialize app');
        setLoading(false);
      }
    };

    // Initialize immediately
    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>❌ Failed to Initialize</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <Text style={styles.errorHint}>
          Please check your internet connection and Firebase configuration.
        </Text>
      </View>
    );
  }

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingHorizontal: 32,
    fontStyle: 'italic',
  },
});
