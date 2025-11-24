/**
 * Asset Details Screen
 * Full asset information with quick actions
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Card, Button, Chip, FAB, useTheme, ActivityIndicator } from 'react-native-paper';
import { getAssetById, markAsSpare, markOutOfService, assignToRoom } from '../../api/assets';
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
    
    try {
      await markAsSpare(asset.id, user.uid, user.displayName || user.email || 'Unknown');
      Alert.alert('Success', 'Asset marked as spare');
      loadAsset();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as spare');
    }
  };

  const handleMarkOutOfService = () => {
    if (!asset || !user) return;
    
    Alert.prompt(
      'Mark Out of Service',
      'Enter reason:',
      async (reason) => {
        if (reason) {
          try {
            await markOutOfService(asset.id, reason, user.uid, user.displayName || user.email || 'Unknown');
            Alert.alert('Success', 'Asset marked out of service');
            loadAsset();
          } catch (error) {
            Alert.alert('Error', 'Failed to mark out of service');
          }
        }
      }
    );
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
              <Text variant="headlineMedium" style={styles.assetName}>{asset.assetType}</Text>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(asset.status) }]}
                textStyle={{ color: '#fff' }}
              >
                {asset.status}
              </Chip>
            </View>
            
            <Text variant="titleMedium" style={styles.category}>{asset.category}</Text>
            <Text variant="bodyMedium" style={styles.qrCode}>QR: {asset.qrCode}</Text>
            <Text variant="bodyMedium" style={styles.qrCode}>Asset ID: {asset.assetId}</Text>
          </Card.Content>
        </Card>

        {/* Images */}
        {asset.imageUrls.length > 0 && (
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
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Manufacturer:</Text>
              <Text style={styles.value}>{asset.manufacturer || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Model:</Text>
              <Text style={styles.value}>{asset.model || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Serial Number:</Text>
              <Text style={styles.value}>{asset.serialNumber || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Ownership:</Text>
              <Text style={styles.value}>{asset.ownership}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Condition:</Text>
              <Text style={styles.value}>{asset.condition}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Location */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{asset.locationType}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Location ID:</Text>
              <Text style={styles.value}>{asset.locationId || 'N/A'}</Text>
            </View>
            
            {asset.dateAssigned && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Date Assigned:</Text>
                <Text style={styles.value}>{formatDisplayDate(asset.dateAssigned)}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

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
              <Text style={styles.value}>{formatDisplayDate(asset.lastServiceDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Next Due:</Text>
              <Text style={styles.value}>{formatDisplayDate(asset.nextServiceDue)}</Text>
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
            
            <View style={styles.actions}>
              <Button mode="outlined" onPress={handleMarkSpare} style={styles.actionButton}>
                Mark as Spare
              </Button>
              <Button mode="outlined" onPress={handleMarkOutOfService} style={styles.actionButton}>
                Mark Out of Service
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('EditAsset', { assetId: asset.id })}
      />
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
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.xs,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
