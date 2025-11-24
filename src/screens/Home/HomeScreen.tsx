/**
 * Home Screen
 * Dashboard showing asset statistics and quick actions
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAssets } from '../../hooks';
import { spacing } from '../../theme';
import { getStatusColor, getServiceStatusColor } from '../../utils/helpers';

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const { assets, loading, error } = useAssets();

  const stats = {
    total: assets.length,
    inUse: assets.filter(a => a.status === 'in-use').length,
    spare: assets.filter(a => a.status === 'spare').length,
    outOfService: assets.filter(a => a.status === 'out-of-service').length,
    dueSoon: assets.filter(a => a.serviceStatus === 'due-soon').length,
    overdue: assets.filter(a => a.serviceStatus === 'overdue').length,
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading assets...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Statistics Cards */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Asset Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="displaySmall" style={styles.statNumber}>{stats.total}</Text>
                <Text variant="bodyMedium">Total Assets</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="displaySmall" style={[styles.statNumber, { color: getStatusColor('in-use') }]}>
                  {stats.inUse}
                </Text>
                <Text variant="bodyMedium">In Use</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Chip icon="check-circle" style={styles.chip} textStyle={{ color: getStatusColor('spare') }}>
                {stats.spare} Spare
              </Chip>
              <Chip icon="alert-circle" style={styles.chip} textStyle={{ color: getStatusColor('out-of-service') }}>
                {stats.outOfService} Out of Service
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Service Status */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Service Status</Text>
            
            <View style={styles.serviceStats}>
              <TouchableOpacity 
                style={[styles.serviceCard, { backgroundColor: getServiceStatusColor('overdue') + '20' }]}
                onPress={() => navigation.navigate('AssetList', { filter: 'overdue' })}
              >
                <Text variant="displaySmall" style={[styles.statNumber, { color: getServiceStatusColor('overdue') }]}>
                  {stats.overdue}
                </Text>
                <Text variant="bodyMedium">Overdue</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.serviceCard, { backgroundColor: getServiceStatusColor('due-soon') + '20' }]}
                onPress={() => navigation.navigate('AssetList', { filter: 'due-soon' })}
              >
                <Text variant="displaySmall" style={[styles.statNumber, { color: getServiceStatusColor('due-soon') }]}>
                  {stats.dueSoon}
                </Text>
                <Text variant="bodyMedium">Due Soon</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Quick Actions</Text>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Scanner')}
              >
                <Text style={styles.actionButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => navigation.navigate('EditAsset', {})}
              >
                <Text style={styles.actionButtonText}>Add Asset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => navigation.navigate('Import')}
              >
                <Text style={styles.actionButtonText}>Import Assets</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.actionButtonText}>View Dashboard</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {error && (
          <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]}>
            <Card.Content>
              <Text style={{ color: '#D32F2F' }}>{error}</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        icon="qrcode-scan"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Scanner')}
        label="Scan"
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
  loadingText: {
    marginTop: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  cardTitle: {
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  chip: {
    marginHorizontal: spacing.xs,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  serviceCard: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
