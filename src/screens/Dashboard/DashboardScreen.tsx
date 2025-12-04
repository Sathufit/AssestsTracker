/**
 * Dashboard Screen - Professional Live Dashboard for Office TV
 * Real-time asset tracking with clean, business-grade interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Icon,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAssets } from '../../hooks';
import { Asset } from '../../types';

interface CategoryStats {
  total: number;
  inUse: number;
  spare: number;
  outOfService: number;
  missing: number;
  dueForService: number;
  overdue: number;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const colors = theme.colors as any;
  const { assets, loading, error, refresh } = useAssets();
  const [stats, setStats] = useState<Record<string, CategoryStats>>({});

  useEffect(() => {
    calculateStats();
  }, [assets]);

  const calculateStats = () => {
    const categoryStats: Record<string, CategoryStats> = {};

    assets.forEach((asset: Asset) => {
      const cat = asset.category || 'Other';
      
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          total: 0,
          inUse: 0,
          spare: 0,
          outOfService: 0,
          missing: 0,
          dueForService: 0,
          overdue: 0,
        };
      }

      categoryStats[cat].total++;

      // Count by status
      if (asset.status === 'in-use') categoryStats[cat].inUse++;
      if (asset.status === 'spare') categoryStats[cat].spare++;
      if (asset.status === 'out-of-service') categoryStats[cat].outOfService++;
      if (asset.status === 'missing') categoryStats[cat].missing++;

      // Count service status
      if (asset.serviceStatus === 'due-soon') categoryStats[cat].dueForService++;
      if (asset.serviceStatus === 'overdue') categoryStats[cat].overdue++;
    });

    setStats(categoryStats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return colors.success;
      case 'due-soon':
        return colors.warning;
      case 'overdue':
      case 'critical':
        return colors.accent;
      default:
        return colors.textTertiary;
    }
  };

  const renderCategoryCard = (category: string, data: CategoryStats) => {
    // Determine card color based on service status
    const hasOverdue = data.overdue > 0;
    const hasDueSoon = data.dueForService > 0;
    const cardColor = hasOverdue ? colors.danger : hasDueSoon ? colors.warning : colors.success;
    const cardColorLight = hasOverdue ? colors.danger + '10' : hasDueSoon ? colors.warning + '10' : colors.success + '10';

    return (
      <Card key={category} style={styles.categoryCard} elevation={3}>
        <LinearGradient
          colors={[cardColorLight, '#FFFFFF']}
          style={styles.cardGradient}
        >
          {/* Category Header with Status Indicator */}
          <View style={styles.categoryHeader}>
            <View style={styles.categoryTitleContainer}>
              <Icon source="folder" size={24} color={cardColor} />
              <Text variant="headlineMedium" style={[styles.categoryTitle, { color: cardColor }]}>
                {category}
              </Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: cardColor }]} />
          </View>

          {/* Main Stats Grid - Larger for TV */}
          <View style={styles.mainStatsGrid}>
            {/* Total - Prominent */}
            <View style={[styles.mainStatBox, { backgroundColor: colors.primary + '15' }]}>
              <Icon source="database" size={32} color={colors.primary} />
              <Text variant="displayLarge" style={[styles.mainStatNumber, { color: colors.primary }]}>
                {data.total}
              </Text>
              <Text variant="titleMedium" style={styles.mainStatLabel}>Total Assets</Text>
            </View>

            {/* In Use */}
            <View style={[styles.statBox, { backgroundColor: colors.success + '15' }]}>
              <Icon source="check-circle" size={24} color={colors.success} />
              <Text variant="displaySmall" style={[styles.statNumber, { color: colors.success }]}>
                {data.inUse}
              </Text>
              <Text variant="titleSmall" style={styles.statLabel}>In Use</Text>
            </View>

            {/* Spare */}
            <View style={[styles.statBox, { backgroundColor: colors.info + '15' }]}>
              <Icon source="package-variant" size={24} color={colors.info} />
              <Text variant="displaySmall" style={[styles.statNumber, { color: colors.info }]}>
                {data.spare}
              </Text>
              <Text variant="titleSmall" style={styles.statLabel}>Spare</Text>
            </View>
          </View>

          {/* Service Status Row */}
          <View style={styles.serviceStatusRow}>
            {/* Overdue - Red Alert */}
            {data.overdue > 0 && (
              <View style={[styles.alertBox, { backgroundColor: colors.danger }]}>
                <LinearGradient
                  colors={[colors.danger, colors.danger + 'CC']}
                  style={styles.alertGradient}
                >
                  <Icon source="alert-circle" size={32} color="#FFFFFF" />
                  <Text variant="displayMedium" style={styles.alertNumber}>
                    {data.overdue}
                  </Text>
                  <Text variant="titleMedium" style={styles.alertLabel}>OVERDUE SERVICE</Text>
                </LinearGradient>
              </View>
            )}

            {/* Due Soon - Orange Warning */}
            {data.dueForService > 0 && (
              <View style={[styles.alertBox, { backgroundColor: colors.warning }]}>
                <LinearGradient
                  colors={[colors.warning, colors.warning + 'CC']}
                  style={styles.alertGradient}
                >
                  <Icon source="clock-alert" size={32} color="#FFFFFF" />
                  <Text variant="displayMedium" style={styles.alertNumber}>
                    {data.dueForService}
                  </Text>
                  <Text variant="titleMedium" style={styles.alertLabel}>DUE SOON</Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Additional Status */}
          <View style={styles.additionalStats}>
            {data.outOfService > 0 && (
              <View style={[styles.miniStatBox, { backgroundColor: colors.warning + '20' }]}>
                <Icon source="wrench" size={20} color={colors.warning} />
                <Text variant="headlineSmall" style={{ color: colors.warning, fontWeight: 'bold' }}>
                  {data.outOfService}
                </Text>
                <Text variant="labelLarge" style={{ color: colors.warning }}>Out of Service</Text>
              </View>
            )}
            {data.missing > 0 && (
              <View style={[styles.miniStatBox, { backgroundColor: colors.danger + '20' }]}>
                <Icon source="help-circle" size={20} color={colors.danger} />
                <Text variant="headlineSmall" style={{ color: colors.danger, fontWeight: 'bold' }}>
                  {data.missing}
                </Text>
                <Text variant="labelLarge" style={{ color: colors.danger }}>Missing</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Card>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <Text variant="displayMedium" style={styles.headerTitle}>Asset Dashboard</Text>
        <Text variant="titleLarge" style={styles.headerSubtitle}>Live Status • {assets.length} Total Assets</Text>
        <Text variant="bodyMedium" style={styles.lastUpdate}>
          Auto-refreshing • Pull to refresh
        </Text>
      </LinearGradient>

      {error && (
        <Card style={styles.errorCard} elevation={3}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: '#D32F2F', fontWeight: 'bold' }}>Error</Text>
            <Text style={{ color: '#F44336', marginTop: 8 }}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.content}>
        {Object.entries(stats)
          .sort(([, a], [, b]) => {
            // Sort by overdue first, then due soon, then by total count
            if (a.overdue !== b.overdue) return b.overdue - a.overdue;
            if (a.dueForService !== b.dueForService) return b.dueForService - a.dueForService;
            return b.total - a.total;
          })
          .map(([category, data]) => renderCategoryCard(category, data))}
      </View>

      {/* Status Legend */}
      <Card style={styles.legendCard} elevation={2}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#51CF66' }]} />
              <Text variant="bodyLarge">All Good - No Issues</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA94D' }]} />
              <Text variant="bodyLarge">Service Due Soon</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text variant="bodyLarge">Overdue Service</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // 60% - Neutral background
  },
  header: {
    padding: 32,
    paddingTop: 48,
    paddingBottom: 32,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 4,
  },
  lastUpdate: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    padding: 16,
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#FFEBEE',
  },
  
  // Category Card Styles
  categoryCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // 60% - White surface
  },
  cardGradient: {
    padding: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontWeight: 'bold',
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    elevation: 2,
  },

  // Main Stats Grid
  mainStatsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  mainStatBox: {
    flex: 3,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    marginRight: 8,
  },
  mainStatNumber: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mainStatLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    marginHorizontal: 4,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Service Status Alerts
  serviceStatusRow: {
    marginBottom: 16,
  },
  alertBox: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    marginBottom: 12,
  },
  alertGradient: {
    padding: 20,
    alignItems: 'center',
  },
  alertNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Additional Stats
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    marginHorizontal: 4,
  },

  // Legend
  legendCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  legendGrid: {
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
    elevation: 2,
  },
});
