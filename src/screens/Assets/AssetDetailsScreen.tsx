/**
 * Asset Details Screen
 * Full asset information with quick actions
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Card, Button, Chip, FAB, useTheme, ActivityIndicator, Dialog, Portal, TextInput, IconButton } from 'react-native-paper';
import { getAssetById, markAsSpare, markOutOfService, assignToRoom, returnToInUse, deleteAsset } from '../../api/assets';
import { Asset } from '../../types';
import { spacing } from '../../theme';
import { formatDisplayDate, getStatusColor, getServiceStatusColor, formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../hooks';

export default function AssetDetailsScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  const { assetId } = route.params;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [outOfServiceDialogVisible, setOutOfServiceDialogVisible] = useState(false);
  const [outOfServiceReason, setOutOfServiceReason] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const data = await getAssetById(assetId);
      setAsset(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSpare = async () => {
    if (!asset || !user) return;
    
    Alert.alert(
      'Mark as Spare',
      'Are you sure you want to mark this asset as spare?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await markAsSpare(asset.id, user.uid, user.displayName || user.email || 'Unknown');
              Alert.alert('Success', 'Asset marked as spare');
              loadAsset();
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as spare');
            }
          }
        }
      ]
    );
  };

  const handleMarkOutOfService = () => {
    setOutOfServiceDialogVisible(true);
  };

  const confirmMarkOutOfService = async () => {
    if (!asset || !user || !outOfServiceReason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    
    try {
      await markOutOfService(asset.id, outOfServiceReason.trim(), user.uid, user.displayName || user.email || 'Unknown');
      setOutOfServiceDialogVisible(false);
      setOutOfServiceReason('');
      Alert.alert('Success', 'Asset marked out of service');
      loadAsset();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark out of service');
    }
  };

  const handleReturnToInUse = async () => {
    if (!asset || !user) return;
    
    Alert.alert(
      'Return to In-Use',
      'Are you sure you want to return this asset to in-use status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await returnToInUse(asset.id, user.uid, user.displayName || user.email || 'Unknown');
              Alert.alert('Success', 'Asset returned to in-use status');
              loadAsset();
            } catch (error) {
              Alert.alert('Error', 'Failed to return asset to in-use');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAsset = () => {
    console.log('🔥 handleDeleteAsset called', { asset, user });
    if (!asset || !user) {
      console.log('❌ Missing asset or user');
      Alert.alert('Error', 'Cannot delete: Missing asset or user information');
      return;
    }
    console.log('🔥 Showing delete dialog');
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!asset || !user) return;
    
    console.log('🔥 User confirmed delete - starting deletion');
    setIsDeleting(true);
    try {
      await deleteAsset(asset.id, user.uid, user.displayName || user.email || 'Unknown');
      console.log('🔥 Asset deleted successfully');
      Alert.alert('Success', 'Asset deleted successfully');
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error: any) {
      console.error('❌ Delete failed:', error);
      Alert.alert('Error', error.message || 'Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!asset) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Asset not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text variant="headlineMedium" style={styles.assetName}>
                {asset.shortDescription || asset.description || asset.assetNumber || 'Asset'}
              </Text>
              {asset.status && (
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(asset.status) }]}
                  textStyle={{ color: '#fff' }}
                >
                  {asset.status}
                </Chip>
              )}
            </View>
            
            {asset.assetRegister && <Text variant="titleMedium" style={styles.category}>{asset.assetRegister}</Text>}
            {asset.assetNumber && <Text variant="bodyMedium" style={styles.qrCode}>Asset Number: {asset.assetNumber}</Text>}
            {asset.qrCode && <Text variant="bodyMedium" style={styles.qrCode}>QR: {asset.qrCode}</Text>}
          </Card.Content>
        </Card>

        {/* Images */}
        {asset.imageUrls && asset.imageUrls.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {asset.imageUrls.map((url, index) => (
                  <Image key={index} source={{ uri: url }} style={styles.image} />
                ))}
              </ScrollView>
            </Card.Content>
          </Card>
        )}

        {/* Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>
            
            {asset.description && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Description:</Text>
                <Text style={styles.value}>{asset.description}</Text>
              </View>
            )}
            
            {asset.manufacturer && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Manufacturer:</Text>
                <Text style={styles.value}>{asset.manufacturer}</Text>
              </View>
            )}
            
            {asset.model && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Model:</Text>
                <Text style={styles.value}>{asset.model}</Text>
              </View>
            )}
            
            {asset.serialNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Serial Number:</Text>
                <Text style={styles.value}>{asset.serialNumber}</Text>
              </View>
            )}
            
            {asset.supplyCondition && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Supply Condition:</Text>
                <Text style={styles.value}>{asset.supplyCondition}</Text>
              </View>
            )}
            
            {asset.commissionDate && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Commission Date:</Text>
                <Text style={styles.value}>{asset.commissionDate}</Text>
              </View>
            )}
            
            {asset.ownership && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Ownership:</Text>
                <Text style={styles.value}>{asset.ownership}</Text>
              </View>
            )}
            
            {asset.condition && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Condition:</Text>
                <Text style={styles.value}>{asset.condition}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Location */}
        {(asset.locationType || asset.locationId || asset.building || asset.floor) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Location</Text>
              
              {asset.locationType && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Type:</Text>
                  <Text style={styles.value}>{asset.locationType}</Text>
                </View>
              )}
              
              {asset.locationId && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Room Number:</Text>
                  <Text style={styles.value}>{asset.locationId}</Text>
                </View>
              )}
              
              {asset.building && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Building:</Text>
                  <Text style={styles.value}>{asset.building}</Text>
                </View>
              )}
              
              {asset.floor && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Floor:</Text>
                  <Text style={styles.value}>{asset.floor}</Text>
                </View>
              )}
              
              {asset.dateAssigned && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Date Assigned:</Text>
                  <Text style={styles.value}>{formatDisplayDate(asset.dateAssigned)}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        
        {/* Out of Service */}
        {asset.status === 'out-of-service' && asset.outOfServiceReason && (
          <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.error }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.error }]}>Out of Service</Text>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Reason:</Text>
                <Text style={styles.value}>{asset.outOfServiceReason}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Maintenance */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Maintenance</Text>
            
            {asset.serviceStatus && (
              <Chip 
                style={[styles.serviceChip, { backgroundColor: getServiceStatusColor(asset.serviceStatus) }]}
                textStyle={{ color: '#fff' }}
              >
                {asset.serviceStatus}
              </Chip>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Last Service:</Text>
              <Text style={styles.value}>{asset.lastServiceDate ? formatDisplayDate(asset.lastServiceDate) : 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Next Due:</Text>
              <Text style={styles.value}>{asset.nextServiceDue ? formatDisplayDate(asset.nextServiceDue) : 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Service Frequency:</Text>
              <Text style={styles.value}>{asset.serviceFrequency ? `${asset.serviceFrequency} days` : 'N/A'}</Text>
            </View>
            
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('AddServiceRecord', { assetId: asset.id })}
              style={styles.serviceButton}
            >
              Add Service Record
            </Button>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
            
            {asset.status !== 'in-use' && (
              <Button 
                mode="contained" 
                onPress={handleReturnToInUse} 
                style={styles.actionButtonFull}
                buttonColor={theme.colors.primary}
              >
                Return to In-Use
              </Button>
            )}
            
            <View style={styles.actionRow}>
              <View style={styles.actionButtonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={handleMarkSpare} 
                  disabled={asset.status === 'spare'}
                  contentStyle={styles.buttonContent}
                >
                  Mark as Spare
                </Button>
              </View>
              <View style={styles.actionButtonContainer}>
                <Button 
                  mode="outlined" 
                  onPress={handleMarkOutOfService} 
                  disabled={asset.status === 'out-of-service'}
                  contentStyle={styles.buttonContent}
                >
                  Out of Service
                </Button>
              </View>
            </View>
            
            <Button 
              mode="contained" 
              onPress={handleDeleteAsset} 
              style={[styles.actionButtonFull, styles.deleteButton]}
              buttonColor="#FF6B6B"
            >
              Delete Asset
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('EditAsset', { assetId: asset.id })}
      />

      {/* Out of Service Dialog */}
      <Portal>
        <Dialog visible={outOfServiceDialogVisible} onDismiss={() => setOutOfServiceDialogVisible(false)}>
          <Dialog.Title>Mark Out of Service</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason *"
              value={outOfServiceReason}
              onChangeText={setOutOfServiceReason}
              placeholder="Enter reason for out of service"
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOutOfServiceDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmMarkOutOfService}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Asset</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete this asset? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              onPress={confirmDelete} 
              loading={isDeleting}
              disabled={isDeleting}
              textColor={theme.colors.primary}
            >
              Delete
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
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  assetName: {
    flex: 1,
    fontWeight: 'bold',
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  category: {
    marginBottom: spacing.xs,
    opacity: 0.7,
  },
  qrCode: {
    opacity: 0.6,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontWeight: '600',
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  serviceChip: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  serviceButton: {
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    width: '100%',
  },
  actionButtonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContent: {
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.xs,
  },
  actionButtonFull: {
    marginTop: spacing.sm,
    width: '100%',
  },
  deleteButton: {
    backgroundColor: '#C62828',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
