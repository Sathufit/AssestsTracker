/**
 * Scanner Screen
 * QR Code scanner for quick asset lookup
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAssets } from '../../hooks';
import { spacing } from '../../theme';

export default function ScannerScreen({ navigation }: any) {
  const theme = useTheme();
  const { searchByQRCode } = useAssets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleBarCodeScanned = async ({ data }: any) => {
    if (scanned || scanning) return;
    
    setScanned(true);
    setScanning(true);

    try {
      const asset = await searchByQRCode(data);
      
      if (asset) {
        navigation.replace('AssetDetails', { assetId: asset.id });
      } else {
        Alert.alert(
          'Asset Not Found',
          `No asset found with QR code: ${data}`,
          [
            { text: 'Scan Again', onPress: () => setScanned(false) },
            { text: 'Cancel', onPress: () => navigation.goBack() },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to search for asset. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setScanning(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.text}>We need camera permission to scan QR codes</Text>
        <Button mode="contained" onPress={requestPermission} style={styles.button}>
          Grant Permission
        </Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.button}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        
        <View style={styles.instructions}>
          <Text variant="titleMedium" style={styles.instructionText}>
            Point camera at QR code
          </Text>
          {scanned && (
            <Button 
              mode="contained" 
              onPress={() => setScanned(false)}
              style={styles.button}
            >
              Scan Again
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  text: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.md,
    borderRadius: 8,
  },
});
