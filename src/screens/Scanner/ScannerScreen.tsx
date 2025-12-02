/**
 * Scanner Screen - Professional QR Code Scanner
 * Quick asset lookup with clean, business-grade interface
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, useTheme, TextInput, Portal, Dialog, Divider, Icon } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import { Asset } from '../../types';
import { getAssetByQRCode, assignToRoom, markAsSpare, markOutOfService } from '../../api/assets';
import { useAuth } from '../../hooks';

export default function ScannerScreen({ navigation }: any) {
  const theme = useTheme();
  const colors = theme.colors as any;
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [showActions, setShowActions] = useState(false);
  
  // Dialog states for quick actions
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);
  const [outOfServiceDialogVisible, setOutOfServiceDialogVisible] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [outOfServiceReason, setOutOfServiceReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleBarCodeScanned = async ({ data }: any) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('QR Code scanned:', data);

    try {
      const foundAsset = await getAssetByQRCode(data);
      
      if (foundAsset) {
        setAsset(foundAsset);
        setShowActions(true);
      } else {
        Alert.alert('Not Found', 'No asset found with this QR code', [
          { text: 'Scan Again', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      console.error('Error searching for asset:', error);
      Alert.alert('Error', 'Failed to search for asset', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleViewDetails = () => {
    if (asset) {
      navigation.navigate('AssetDetails', { assetId: asset.id });
      resetScanner();
    }
  };

  const handleAssignToRoom = async () => {
    if (!asset || !user) return;
    
    if (!roomNumber.trim()) {
      Alert.alert('Error', 'Please enter a room number');
      return;
    }
    
    setProcessing(true);
    try {
      await assignToRoom(
        asset.id,
        roomNumber.trim(),
        building.trim() || undefined,
        floor.trim() || undefined,
        user.uid,
        user.displayName || user.email || 'Unknown'
      );
      
      Alert.alert('Success', `Asset assigned to room ${roomNumber}`, [
        { text: 'OK', onPress: resetScanner }
      ]);
      setAssignDialogVisible(false);
      setRoomNumber('');
      setBuilding('');
      setFloor('');
    } catch (error) {
      console.error('Error assigning to room:', error);
      Alert.alert('Error', 'Failed to assign asset to room');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAsSpare = async () => {
    if (!asset || !user) return;
    
    setProcessing(true);
    try {
      await markAsSpare(asset.id, user.uid, user.displayName || user.email || 'Unknown');
      
      Alert.alert('Success', 'Asset marked as spare', [
        { text: 'OK', onPress: resetScanner }
      ]);
    } catch (error) {
      console.error('Error marking as spare:', error);
      Alert.alert('Error', 'Failed to mark asset as spare');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkOutOfService = async () => {
    if (!asset || !user) return;
    
    if (!outOfServiceReason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    
    setProcessing(true);
    try {
      await markOutOfService(
        asset.id,
        outOfServiceReason.trim(),
        user.uid,
        user.displayName || user.email || 'Unknown'
      );
      
      Alert.alert('Success', 'Asset marked out of service', [
        { text: 'OK', onPress: resetScanner }
      ]);
      setOutOfServiceDialogVisible(false);
      setOutOfServiceReason('');
    } catch (error) {
      console.error('Error marking out of service:', error);
      Alert.alert('Error', 'Failed to mark asset out of service');
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setAsset(null);
    setShowActions(false);
    setAssignDialogVisible(false);
    setOutOfServiceDialogVisible(false);
    setRoomNumber('');
    setBuilding('');
    setFloor('');
    setOutOfServiceReason('');
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
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={[styles.container, styles.centered]}
      >
        <View style={styles.permissionCard}>
          <Text variant="headlineMedium" style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>
            We need camera permission to scan QR codes on your assets
          </Text>
          <Button 
            mode="contained" 
            onPress={requestPermission} 
            style={styles.button}
            buttonColor="#FFFFFF"
            textColor={theme.colors.primary}
          >
            Grant Permission
          </Button>
          <Button 
            mode="text" 
            onPress={() => navigation.goBack()} 
            style={styles.button}
            textColor="#FFFFFF"
          >
            Go Back
          </Button>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {!showActions ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.instructions}
            >
              <Text variant="headlineSmall" style={styles.instructionText}>
                {scanned ? 'Searching...' : 'Scan QR Code'}
              </Text>
              <Text variant="bodyMedium" style={styles.instructionSubtext}>
                {scanned ? 'Looking up asset...' : 'Center the QR code in the frame'}
              </Text>
              {scanned && !showActions && (
                <Button 
                  mode="contained" 
                  onPress={() => setScanned(false)}
                  style={styles.retryButton}
                  buttonColor={theme.colors.primary}
                >
                  Scan Again
                </Button>
              )}
            </LinearGradient>
          </View>
        </>
      ) : (
        <ScrollView style={styles.actionsContainer} contentContainerStyle={styles.actionsContent}>
          {/* Asset Header with Gradient */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.assetHeader}
          >
            <Text variant="displaySmall" style={styles.assetTitle}>
              {asset?.assetNumber || asset?.shortDescription || 'Asset Found'}
            </Text>
            {asset?.description && (
              <Text variant="titleMedium" style={styles.assetDescription}>
                {asset.description}
              </Text>
            )}
          </LinearGradient>

          {/* Asset Details Card */}
          <View style={styles.detailsCard}>
            {asset?.manufacturer && asset?.model && (
              <View style={styles.detailRow}>
                <Icon source="factory" size={18} color={colors.textSecondary} />
                <Text variant="labelLarge" style={styles.detailLabel}>Manufacturer:</Text>
                <Text variant="bodyLarge" style={styles.detailValue}>{asset.manufacturer} - {asset.model}</Text>
              </View>
            )}
            
            {asset?.status && (
              <View style={styles.detailRow}>
                <Icon source="information" size={18} color={colors.textSecondary} />
                <Text variant="labelLarge" style={styles.detailLabel}>Status:</Text>
                <Text variant="bodyLarge" style={[styles.detailValue, { fontWeight: 'bold', color: theme.colors.primary }]}>
                  {asset.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
            )}

            {asset?.locationId && (
              <View style={styles.detailRow}>
                <Icon source="map-marker" size={18} color={colors.textSecondary} />
                <Text variant="labelLarge" style={styles.detailLabel}>Location:</Text>
                <Text variant="bodyLarge" style={styles.detailValue}>{asset.locationId}</Text>
              </View>
            )}

            {asset?.building && (
              <View style={styles.detailRow}>
                <Icon source="office-building" size={18} color={colors.textSecondary} />
                <Text variant="labelLarge" style={styles.detailLabel}>Building:</Text>
                <Text variant="bodyLarge" style={styles.detailValue}>{asset.building}</Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />
          
          <Text variant="headlineSmall" style={styles.quickActionsTitle}>
            Quick Actions
          </Text>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => setAssignDialogVisible(true)}
              style={styles.actionButton}
              icon="home-map-marker"
              buttonColor="#26C281"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              disabled={processing}
            >
              Assign to Room
            </Button>
            
            <Button
              mode="contained"
              onPress={handleMarkAsSpare}
              style={styles.actionButton}
              icon="package-variant"
              buttonColor="#7E57C2"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              disabled={processing}
            >
              Mark as Spare
            </Button>
            
            <Button
              mode="contained"
              onPress={() => setOutOfServiceDialogVisible(true)}
              style={styles.actionButton}
              icon="alert-circle"
              buttonColor="#F39C12"
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              disabled={processing}
            >
              Out of Service
            </Button>
            
            <Button
              mode="elevated"
              onPress={handleViewDetails}
              style={[styles.actionButton, styles.viewDetailsButton]}
              icon="information"
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: theme.colors.primary }]}
              disabled={processing}
            >
              View Full Details
            </Button>
            
            <Button
              mode="text"
              onPress={resetScanner}
              style={styles.actionButton}
              labelStyle={{ fontSize: 16 }}
              disabled={processing}
            >
              Scan Another Asset
            </Button>
          </View>
        </ScrollView>
      )}

      {/* Assign to Room Dialog */}
      <Portal>
        <Dialog visible={assignDialogVisible} onDismiss={() => setAssignDialogVisible(false)}>
          <Dialog.Title>Assign to Room</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Room Number *"
              value={roomNumber}
              onChangeText={setRoomNumber}
              mode="outlined"
              style={styles.input}
              autoFocus
            />
            <TextInput
              label="Building (Optional)"
              value={building}
              onChangeText={setBuilding}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Floor (Optional)"
              value={floor}
              onChangeText={setFloor}
              mode="outlined"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAssignDialogVisible(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onPress={handleAssignToRoom} loading={processing} disabled={processing}>
              Assign
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Out of Service Dialog */}
        <Dialog visible={outOfServiceDialogVisible} onDismiss={() => setOutOfServiceDialogVisible(false)}>
          <Dialog.Title>Mark Out of Service</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason *"
              value={outOfServiceReason}
              onChangeText={setOutOfServiceReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOutOfServiceDialogVisible(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onPress={handleMarkOutOfService} loading={processing} disabled={processing}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  // Permission Screen
  permissionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 32,
    borderRadius: 20,
    margin: 24,
    alignItems: 'center',
    elevation: 8,
  },
  permissionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
  button: {
    marginTop: spacing.md,
    minWidth: 200,
  },
  
  // Scanner Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#00ACC1',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructions: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionSubtext: {
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  retryButton: {
    marginTop: 16,
  },
  
  // Actions Container
  actionsContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  actionsContent: {
    paddingBottom: 32,
  },
  assetHeader: {
    padding: 24,
    paddingTop: 48,
  },
  assetTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  assetDescription: {
    color: '#FFFFFF',
    opacity: 0.95,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    minWidth: 130,
    fontWeight: '600',
    opacity: 0.7,
  },
  detailValue: {
    flex: 1,
  },
  divider: {
    marginVertical: 24,
    marginHorizontal: 16,
  },
  quickActionsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    elevation: 2,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#00ACC1',
  },
  input: {
    marginBottom: spacing.md,
  },
});
