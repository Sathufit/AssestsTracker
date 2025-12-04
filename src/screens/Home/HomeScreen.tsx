/**
 * Home Screen - Professional Business Dashboard
 * Clean, sophisticated interface for asset management
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, useTheme, ActivityIndicator, Icon } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAssets } from '../../hooks';
import { spacing } from '../../theme';

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const { assets, loading, error } = useAssets();
  
  // Type assertion for custom colors
  const colors = theme.colors as any;

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
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text variant="headlineLarge" style={styles.heroTitle}>
            Asset Management System
          </Text>
          <Text variant="titleMedium" style={styles.heroSubtitle}>
            Professional asset tracking and monitoring
          </Text>
        </LinearGradient>

        {/* Statistics Cards - Professional Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, styles.largeStatCard]} elevation={2}>
              <LinearGradient
                colors={[colors.primary + '15', colors.primary + '05']}
                style={styles.statGradient}
              >
                <Icon source="database" size={32} color={colors.primary} />
                <Text variant="displayMedium" style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.total}
                </Text>
                <Text variant="titleMedium" style={styles.statLabel}>Total Assets</Text>
              </LinearGradient>
            </Card>
            
            <View style={styles.smallStatsColumn}>
              <Card style={styles.statCard} elevation={2}>
                <LinearGradient
                  colors={[colors.primary + '15', colors.primary + '05']}
                  style={styles.statGradient}
                >
                  <Icon source="check-circle" size={24} color={colors.primary} />
                  <Text variant="headlineMedium" style={[styles.statNumber, { color: colors.primary }]}>
                    {stats.inUse}
                  </Text>
                  <Text variant="bodyLarge" style={styles.statLabel}>In Use</Text>
                </LinearGradient>
              </Card>
              
              <Card style={styles.statCard} elevation={2}>
                <LinearGradient
                  colors={[colors.primary + '15', colors.primary + '05']}
                  style={styles.statGradient}
                >
                  <Icon source="package-variant" size={24} color={colors.primary} />
                  <Text variant="headlineMedium" style={[styles.statNumber, { color: colors.primary }]}>
                    {stats.spare}
                  </Text>
                  <Text variant="bodyLarge" style={styles.statLabel}>Spare</Text>
                </LinearGradient>
              </Card>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <Card style={styles.statCard} elevation={2}>
              <LinearGradient
                colors={[colors.primary + '15', colors.primary + '05']}
                style={styles.statGradient}
              >
                <Icon source="wrench" size={28} color={colors.primary} />
                <Text variant="headlineLarge" style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.outOfService}
                </Text>
                <Text variant="titleSmall" style={styles.statLabel}>Out of Service</Text>
              </LinearGradient>
            </Card>
            
            <Card style={styles.statCard} elevation={2}>
              <LinearGradient
                colors={[colors.accent + '15', colors.accent + '05']}
                style={styles.statGradient}
              >
                <Icon source="alert-circle" size={28} color={colors.accent} />
                <Text variant="headlineLarge" style={[styles.statNumber, { color: colors.accent }]}>
                  {stats.overdue}
                </Text>
                <Text variant="titleSmall" style={styles.statLabel}>Overdue</Text>
              </LinearGradient>
            </Card>
            
            <Card style={styles.statCard} elevation={2}>
              <LinearGradient
                colors={[colors.primary + '15', colors.primary + '05']}
                style={styles.statGradient}
              >
                <Icon source="clock-alert" size={28} color={colors.primary} />
                <Text variant="headlineLarge" style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.dueSoon}
                </Text>
                <Text variant="titleSmall" style={styles.statLabel}>Due Soon</Text>
              </LinearGradient>
            </Card>
          </View>
        </View>

        {/* Quick Actions - Professional Grid */}
        <Card style={styles.actionsCard} elevation={3}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AssetList')}
                activeOpacity={0.7}
              >
                <Icon source="view-list" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>View All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('Scanner')}
                activeOpacity={0.7}
              >
                <Icon source="qrcode-scan" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Scan QR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('EditAsset', {})}
                activeOpacity={0.7}
              >
                <Icon source="plus-circle" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Add Asset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => navigation.navigate('Import')}
                activeOpacity={0.7}
              >
                <Icon source="file-import" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Import</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                onPress={() => navigation.navigate('Dashboard')}
                activeOpacity={0.7}
              >
                <Icon source="chart-box" size={28} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Dashboard</Text>
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
        style={[styles.fab, { backgroundColor: colors.accent }]}
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
  
  // Hero Section
  heroCard: {
    padding: spacing.xl * 2,
    borderRadius: 16,
    marginBottom: spacing.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  heroTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    color: '#FFF',
    opacity: 0.95,
  },
  
  // Statistics
  statsContainer: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 120,
  },
  statGradient: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeStatCard: {
    minHeight: 160,
  },
  smallStatsColumn: {
    flex: 1,
    gap: spacing.md,
  },
  statNumber: {
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Actions
  actionsCard: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginBottom: spacing.md,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 6,
  },
});
