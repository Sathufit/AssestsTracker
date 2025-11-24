/**
 * Import Screen - Excel/CSV Import for Asset Data
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { createAsset } from '../../api/assets';
import { AssetFormValues } from '../../types';
import { useAuth } from '../../hooks';

export default function ImportScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvContent: string): AssetFormValues[] => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const assets: AssetFormValues[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      // Map CSV columns to AssetFormValues
      const asset: AssetFormValues = {
        assetId: row['asset id'] || row['assetid'] || row['tag number'] || '',
        qrCode: row['qr code'] || row['qrcode'] || row['qr'] || '',
        category: row['category'] || '',
        assetType: row['asset type'] || row['assettype'] || row['type'] || '',
        manufacturer: row['manufacturer'] || '',
        model: row['model'] || '',
        serialNumber: row['serial number'] || row['serialnumber'] || row['serial'] || '',
        ownership: (row['ownership'] || 'facility-owned') as any,
        status: (row['status'] || 'in-use') as any,
        condition: (row['condition'] || 'good') as any,
        outOfServiceReason: row['out of service reason'] || row['outofservicereason'] || '',
        locationType: (row['location type'] || row['locationtype'] || 'rac-room') as any,
        locationId: row['location id'] || row['locationid'] || row['location'] || row['room'] || '',
        building: row['building'] || '',
        floor: row['floor'] || '',
        locationNotes: row['location notes'] || row['locationnotes'] || '',
        serviceFrequency: row['service frequency'] || row['servicefrequency'] || '',
        lastServiceDate: row['last service date'] || row['lastservicedate'] || '',
        calibrationRequired: (row['calibration required'] || row['calibrationrequired'] || '').toLowerCase() === 'true',
        calibrationFrequency: row['calibration frequency'] || row['calibrationfrequency'] || '',
        safeWorkingLoad: row['safe working load'] || row['safeworkingload'] || row['swl'] || '',
      };

      // Skip if missing required fields
      if (asset.assetId && asset.qrCode && asset.category && asset.assetType) {
        assets.push(asset);
      }
    }

    return assets;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to import assets');
      return;
    }

    setImporting(true);
    
    try {
      // Read file content (web compatible)
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        // Use FileReader for web
        const response = await fetch(selectedFile.uri);
        fileContent = await response.text();
      } else {
        // Use expo-file-system for native
        const FileSystem = require('expo-file-system/legacy');
        fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
          encoding: 'utf8',
        });
      }

      // Parse CSV
      const assets = parseCSV(fileContent);
      
      if (assets.length === 0) {
        Alert.alert('No Assets', 'No valid assets found in the file. Please check the format.');
        setImporting(false);
        return;
      }

      // Import assets one by one
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const asset of assets) {
        try {
          await createAsset(asset, user.uid, user.displayName || user.email || 'Unknown');
          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`${asset.assetId}: ${error.message}`);
        }
      }

      // Show results
      if (successCount > 0) {
        Alert.alert(
          'Import Complete',
          `Successfully imported ${successCount} asset(s).${errorCount > 0 ? `\n\nFailed: ${errorCount}` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Import Failed', `Failed to import any assets.\n\n${errors.slice(0, 3).join('\n')}`);
      }

      setSelectedFile(null);
    } catch (error: any) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', error.message || 'Failed to import assets');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>Import Assets</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Upload an Excel or CSV file to bulk import assets
          </Text>

          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={pickDocument}
              disabled={importing}
              icon="file-upload"
              style={styles.button}
            >
              Select File
            </Button>

            {selectedFile && (
              <View style={styles.fileInfo}>
                <Text variant="bodyMedium">
                  Selected: {selectedFile.name}
                </Text>
                <Text variant="bodySmall" style={styles.fileSize}>
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}

            {selectedFile && (
              <Button
                mode="contained"
                onPress={handleImport}
                disabled={importing}
                icon="upload"
                style={styles.button}
                buttonColor={theme.colors.secondary}
              >
                {importing ? 'Importing...' : 'Import Assets'}
              </Button>
            )}

            {importing && (
              <View style={styles.loading}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Importing assets...</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>Required Columns</Text>
          <List.Section>
            <List.Item
              title="Asset ID / Tag Number"
              description="Unique identifier for the asset"
              left={props => <List.Icon {...props} icon="identifier" />}
            />
            <List.Item
              title="QR Code Value"
              description="QR code associated with asset"
              left={props => <List.Icon {...props} icon="qrcode" />}
            />
            <List.Item
              title="Category"
              description="Mobility, Pressure Care, Hoists, etc."
              left={props => <List.Icon {...props} icon="format-list-bulleted" />}
            />
            <List.Item
              title="Asset Type"
              description="Air Mattress, Ceiling Hoist, Wheelchair, etc."
              left={props => <List.Icon {...props} icon="package-variant" />}
            />
            <List.Item
              title="Status"
              description="in-use, spare, out-of-service, etc."
              left={props => <List.Icon {...props} icon="check-circle" />}
            />
            <List.Item
              title="Location"
              description="Room number, storage area, etc."
              left={props => <List.Icon {...props} icon="map-marker" />}
            />
          </List.Section>

          <Text variant="bodySmall" style={styles.note}>
            Note: Use the provided Excel Master Template for best results.
            Additional fields like manufacturer, model, service dates, and
            calibration info are optional but recommended.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 16,
    color: '#666',
  },
  section: {
    marginTop: 16,
  },
  button: {
    marginVertical: 8,
  },
  fileInfo: {
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginVertical: 8,
  },
  fileSize: {
    marginTop: 4,
    color: '#666',
  },
  loading: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  note: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    color: '#666',
  },
});
