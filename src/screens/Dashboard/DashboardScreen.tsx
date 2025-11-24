/**
 * Dashboard Screen - Live Dashboard Display for Office TV
 * Shows real-time asset status with color coding
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
  Chip,
} from 'react-native-paper';
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
        return '#4CAF50';
      case 'due-soon':
        return '#FF9800';
      case 'overdue':
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderCategoryCard = (category: string, data: CategoryStats) => {
    const overdueColor = data.overdue > 0 ? '#F44336' : data.dueForService > 0 ? '#FF9800' : '#4CAF50';

    return (
      <Card key={category} style={[styles.card, { borderLeftColor: overdueColor, borderLeftWidth: 6 }]}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.categoryTitle}>{category}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{data.inUse}</Text>
              <Text style={styles.statLabel}>In Use</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#2196F3' }]}>{data.spare}</Text>
              <Text style={styles.statLabel}>Spare</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>{data.outOfService}</Text>
              <Text style={styles.statLabel}>Out of Service</Text>
            </View>
          </View>

          {(data.dueForService > 0 || data.overdue > 0) && (
            <View style={styles.alertRow}>
              {data.overdue > 0 && (
                <Chip icon="alert" style={[styles.chip, { backgroundColor: '#FFCDD2' }]}>
                  {data.overdue} Overdue Service
                </Chip>
              )}
              {data.dueForService > 0 && (
                <Chip icon="clock-alert" style={[styles.chip, { backgroundColor: '#FFE0B2' }]}>
                  {data.dueForService} Due Soon
                </Chip>
              )}
            </View>
          )}

          {data.missing > 0 && (
            <View style={styles.alertRow}>
              <Chip icon="alert-circle" style={[styles.chip, { backgroundColor: '#F8BBD0' }]}>
                {data.missing} Missing
              </Chip>
            </View>
          )}
        </Card.Content>
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
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.headerTitle}>Asset Dashboard</Text>
        <Text variant="bodyLarge" style={styles.headerSubtitle}>Live Status Overview</Text>
      </View>

      {error && (
        <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]}>
          <Card.Content>
            <Text style={{ color: '#D32F2F' }}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.content}>
        {Object.entries(stats).map(([category, data]) => renderCategoryCard(category, data))}
      </View>

      <View style={styles.legend}>
        <Text variant="titleMedium" style={styles.legendTitle}>Status Legend</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>All Good</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Service Due Soon</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Overdue or Out of Service</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#E3F2FD',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 3,
  },
  categoryTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976D2',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  alertRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
  },
  legend: {
    padding: 16,
    backgroundColor: '#FFF',
    marginTop: 16,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendItem: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#424242',
  },
});
