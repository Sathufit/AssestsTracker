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
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import { createAsset } from '../../api/assets';
import { AssetFormValues } from '../../types';
import { useAuth } from '../../hooks';

export default function ImportScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [totalAssets, setTotalAssets] = useState(0);
  const [processedAssets, setProcessedAssets] = useState(0);

  const parseExcelFile = async (fileUri: string): Promise<{ assets: AssetFormValues[], headers: string[] }> => {
    try {
      console.log('📊 Starting to parse Excel file:', fileUri);
      let workbook: XLSX.WorkBook;
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform - using fetch');
        // For web, fetch the file and parse
        const response = await fetch(fileUri);
        console.log('Response status:', response.status);
        const arrayBuffer = await response.arrayBuffer();
        console.log('Array buffer size:', arrayBuffer.byteLength);
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      } else {
        console.log('📱 Native platform - using FileSystem');
        // For native, read file as base64 and parse
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64' as any,
        });
        console.log('Base64 length:', base64.length);
        workbook = XLSX.read(base64, { type: 'base64' });
      }

      console.log('📑 Workbook loaded. Sheets:', workbook.SheetNames);

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      console.log('📋 Using sheet:', sheetName);
      
      // Get the range - we want to skip first 2 rows and use row 3 as headers
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      console.log('Sheet range:', range);
      
      // Convert to JSON - Start from row 5 (index 4), which contains the actual column headers
      // Row 1: Title, Row 2: Parameters, Row 3: Empty, Row 4: Technical names
      // Row 5: Column headers (Asset, Description, etc.)
      // Data will be read from row 6 onwards
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '',
        range: 4, // Start reading from row 5 (0-indexed row 4) - this row becomes headers
      }) as any[];

      console.log(`📊 Parsed ${jsonData.length} rows from Excel`);
      
      let headers: string[] = [];
      if (jsonData.length > 0) {
        headers = Object.keys(jsonData[0]);
        console.log('🔍 Headers found:', headers);
        console.log('🔍 First data row:', jsonData[0]);
        console.log('🔍 Second data row:', jsonData[1]);
      }

      // Map to AssetFormValues - Direct mapping from your Excel columns
      const assets: AssetFormValues[] = jsonData.map((row: any, index: number) => {
        // Direct mapping from Excel columns (no validation, import everything)
        const assetNumber = (row['Asset'] || row['assetNumber'] || '').toString().trim();
        
        const asset: AssetFormValues = {
          // Core fields - direct mapping from Excel
          assetNumber,
          description: (row['Description'] || row['description'] || '').toString().trim(),
          assetRegister: (row['Asset Register'] || row['assetRegister'] || '').toString().trim(),
          shortDescription: (row['Short Description'] || row['shortDescription'] || '').toString().trim(),
          commissionDate: (row['Commission Date'] || row['commissionDate'] || '').toString().trim(),
          manufacturer: (row['Manufacturer'] || row['manufacturer'] || '').toString().trim(),
          model: (row['Model'] || row['model'] || '').toString().trim(),
          supplyCondition: (row['Supply Condition'] || row['supplyCondition'] || '').toString().trim(),
          
          // Auto-generate QR code from assetNumber if not provided
          qrCode: (row['QR Code'] || row['qrCode'] || '').toString().trim() || (assetNumber ? `ASSET-${assetNumber}` : ''),
          
          // Optional fields - keep for compatibility
          category: (row['Category'] || row['category'] || '').toString().trim(),
          serialNumber: (row['Serial Number'] || row['serialNumber'] || '').toString().trim(),
          status: row['Status'] || row['status'] || undefined,
          condition: row['Condition'] || row['condition'] || undefined,
          ownership: row['Ownership'] || row['ownership'] || undefined,
          locationType: row['Location Type'] || row['locationType'] || undefined,
          locationId: (row['Location ID'] || row['locationId'] || '').toString().trim(),
          
          // Location details
          dateAssigned: (row['Date Assigned'] || row['dateAssigned'] || '').toString().trim(),
          building: (row['Building'] || row['building'] || '').toString().trim(),
          floor: (row['Floor'] || row['floor'] || '').toString().trim(),
          outOfServiceReason: (row['Out of Service Reason'] || row['outOfServiceReason'] || '').toString().trim(),
          
          // Service fields - all optional
          serviceFrequency: (row['Service Frequency'] || row['serviceFrequency'] || '').toString().trim(),
          lastServiceDate: (row['Last Service Date'] || row['lastServiceDate'] || '').toString().trim(),
          calibrationRequired: row['Calibration Required'] === 'Yes' || row['calibrationRequired'] === true || false,
          calibrationFrequency: (row['Calibration Frequency'] || row['calibrationFrequency'] || '').toString().trim(),
          safeWorkingLoad: (row['Safe Working Load'] || row['safeWorkingLoad'] || '').toString().trim(),
        };
        
        console.log(`Row ${index + 6}:`, asset);
        
        return asset;
      }); // NO FILTERING - Import all rows even if fields are empty

      console.log(`✅ Filtered to ${assets.length} valid assets`);
      
      return { assets, headers };
    } catch (error) {
      console.error('❌ Error parsing Excel file:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to parse Excel file. Please check the file format.');
    }
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
    console.log('🔵 Import button clicked');
    console.log('Selected file:', selectedFile);
    console.log('User:', user);
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    if (!user) {
      console.log('❌ User not logged in');
      Alert.alert('Error', 'You must be logged in to import assets');
      return;
    }

    console.log('🟡 Starting import process...');
    setImporting(true);
    
    try {
      console.log('📄 Parsing file:', selectedFile.uri);
      
      // Parse the file (works for both Excel and CSV)
      const result = await parseExcelFile(selectedFile.uri);
      const assets = result.assets;
      const headers = result.headers;
      
      console.log(`✅ Parsed ${assets.length} assets from file`);
      console.log('First asset sample:', assets[0]);
      
      if (assets.length === 0) {
        console.log('⚠️ No data rows found in Excel file');
        Alert.alert('No Data', 'The Excel file appears to be empty or has no data rows after row 5.');
        setImporting(false);
        return;
      }

      // Import assets one by one with duplicate checking
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      const skipped: string[] = [];

      setTotalAssets(assets.length);
      setProcessedAssets(0);
      console.log(`🟢 Starting to import ${assets.length} assets...`);
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const assetIdentifier = asset.assetNumber || asset.description || asset.shortDescription || `Row ${i + 6}`;
        
        // Update progress
        const currentProgress = ((i + 1) / assets.length) * 100;
        setProgress(currentProgress);
        setProcessedAssets(i + 1);
        setProgressText(`Processing ${i + 1}/${assets.length}: ${assetIdentifier}`);
        
        console.log(`Processing asset ${i + 1}/${assets.length}: ${assetIdentifier}`);
        
        try {
          // Check if asset already exists (skip duplicates)
          let existingAsset = null;
          
          // Try to find by assetNumber first
          if (asset.assetNumber && asset.assetNumber.trim() !== '') {
            const { getAssetByAssetNumber } = await import('../../api/assets');
            existingAsset = await getAssetByAssetNumber(asset.assetNumber);
          }
          
          if (existingAsset) {
            skippedCount++;
            skipped.push(assetIdentifier);
            console.log(`⏭️ Skipped (already exists): ${assetIdentifier}`);
            continue;
          }
          
          // If not found, create new asset
          await createAsset(asset, user.uid, user.displayName || user.email || 'Unknown');
          successCount++;
          console.log(`✅ Successfully imported: ${assetIdentifier}`);
        } catch (error: any) {
          errorCount++;
          const errorMsg = `${assetIdentifier}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ Failed to import ${assetIdentifier}:`, error);
        }
      }

      setProgress(100);
      setProgressText('Import complete!');
      console.log(`✅ Import complete. Success: ${successCount}, Skipped: ${skippedCount}, Failed: ${errorCount}`);

      // Show results
      if (successCount > 0 || skippedCount > 0) {
        let message = '';
        if (successCount > 0) message += `✅ Imported: ${successCount} new asset(s)\n`;
        if (skippedCount > 0) message += `⏭️ Skipped: ${skippedCount} (already exist)\n`;
        if (errorCount > 0) message += `❌ Failed: ${errorCount}\n${errors.slice(0, 3).join('\n')}`;
        
        Alert.alert('Import Complete', message.trim(), [{ text: 'OK' }]);
      } else {
        Alert.alert('Import Failed', `Failed to import any assets.\n\n${errors.slice(0, 3).join('\n')}`);
      }

      setSelectedFile(null);
    } catch (error: any) {
      console.error('❌ Import error:', error);
      console.error('Error stack:', error.stack);
      Alert.alert('Import Failed', error.message || 'Failed to import assets. Check console for details.');
    } finally {
      setImporting(false);
      console.log('🔵 Import process finished');
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
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
                </View>
                
                {/* Progress Details */}
                <Text style={styles.progressDetails}>
                  {processedAssets} / {totalAssets} assets processed
                </Text>
                <Text style={styles.progressStatus} numberOfLines={1}>
                  {progressText}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>Excel Columns</Text>
          <List.Section>
            <List.Item
              title="Asset"
              description="Asset number (e.g., 0002202)"
              left={props => <List.Icon {...props} icon="identifier" />}
            />
            <List.Item
              title="Description"
              description="Full asset description"
              left={props => <List.Icon {...props} icon="text" />}
            />
            <List.Item
              title="Asset Register"
              description="Asset register name (e.g., OPASSET)"
              left={props => <List.Icon {...props} icon="format-list-bulleted" />}
            />
            <List.Item
              title="Short Description"
              description="Short form description"
              left={props => <List.Icon {...props} icon="text-short" />}
            />
            <List.Item
              title="Commission Date"
              description="Date format: YYYY-MM-DD"
              left={props => <List.Icon {...props} icon="calendar" />}
            />
            <List.Item
              title="Manufacturer"
              description="Manufacturer name"
              left={props => <List.Icon {...props} icon="factory" />}
            />
            <List.Item
              title="Model"
              description="Model number"
              left={props => <List.Icon {...props} icon="package-variant" />}
            />
            <List.Item
              title="Supply Condition"
              description="New, Used, Repaired, etc."
              left={props => <List.Icon {...props} icon="check-circle" />}
            />
          </List.Section>

          <Text variant="bodySmall" style={styles.note}>
            ✅ All fields are optional - import rows even if some data is missing{'\n'}
            ✅ First 2 rows are skipped (metadata){'\n'}
            ✅ Row 3 should contain column headers{'\n'}
            ✅ Data starts from row 4 onwards
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
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressPercentage: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  progressDetails: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressStatus: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    maxWidth: '90%',
  },
  note: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    color: '#666',
  },
});
