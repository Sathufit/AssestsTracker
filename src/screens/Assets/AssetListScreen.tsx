/**
 * Asset List Screen - Professional Design
 * Browse, search, and filter all assets with clean interface
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, FAB, Menu, Button, useTheme, ActivityIndicator, Icon, Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAssets, useAuth } from '../../hooks';
import { spacing } from '../../theme';
import { getStatusColor, getServiceStatusColor, formatDisplayDate } from '../../utils/helpers';
import { Asset } from '../../types';
import { deleteAsset } from '../../api/assets';

export default function AssetListScreen({ navigation, route }: any) {
  const theme = useTheme();
  const colors = theme.colors as any;
  const { assets, loading, error } = useAssets();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(route.params?.filter || null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(assets.map(a => a.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [assets]);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (asset.assetNumber && asset.assetNumber.toLowerCase().includes(searchLower)) ||
        (asset.description && asset.description.toLowerCase().includes(searchLower)) ||
        (asset.category && asset.category.toLowerCase().includes(searchLower)) ||
        (asset.locationId && asset.locationId.toLowerCase().includes(searchLower)) ||
        (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = !statusFilter || asset.status === statusFilter;

      // Category filter
      const matchesCategory = !categoryFilter || asset.category === categoryFilter;

      // Service status filter (for special filters like 'overdue', 'due-soon')
      if (statusFilter === 'overdue') {
        return matchesSearch && asset.serviceStatus === 'overdue';
      }
      if (statusFilter === 'due-soon') {
        return matchesSearch && asset.serviceStatus === 'due-soon';
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [assets, searchQuery, statusFilter, categoryFilter]);

  const toggleSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const selectAll = () => {
    setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedAssets(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedAssets.size === 0 || !user) return;

    Alert.alert(
      'Delete Assets',
      `Are you sure you want to delete ${selectedAssets.size} asset(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                Array.from(selectedAssets).map(id => 
                  deleteAsset(id, user.uid, user.displayName || user.email || 'Unknown')
                )
              );
              Alert.alert('Success', `Deleted ${selectedAssets.size} asset(s)`);
              setSelectedAssets(new Set());
              setSelectionMode(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some assets');
            }
          }
        }
      ]
    );
  };

  const renderAssetCard = ({ item }: { item: Asset }) => {
    const statusColor = item.status ? getStatusColor(item.status) : theme.colors.primary;
    const isSelected = selectedAssets.has(item.id);
    
    return (
      <TouchableOpacity
        onPress={() => selectionMode ? toggleSelection(item.id) : navigation.navigate('AssetDetails', { assetId: item.id })}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
        activeOpacity={0.7}
      >
        <Card style={[styles.card, isSelected && styles.selectedCard]} elevation={3}>
          <LinearGradient
            colors={[statusColor + '08', statusColor + '03']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                {selectionMode && (
                  <Checkbox
                    status={isSelected ? 'checked' : 'unchecked'}
                    onPress={() => toggleSelection(item.id)}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="titleLarge" style={[styles.assetNumber, { color: statusColor }]}>
                    {item.assetNumber || 'N/A'}
                  </Text>
                  <Text variant="bodyLarge" numberOfLines={2} style={styles.description}>
                    {item.description || 'No description'}
                  </Text>
                </View>
                {item.status && (
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
                    textStyle={{ color: statusColor, fontSize: 12, fontWeight: 'bold' }}
                  >
                    {item.status.replace('-', ' ').toUpperCase()}
                  </Chip>
                )}
              </View>

              <View style={styles.cardDetails}>
                {item.category && (
                  <View style={styles.detailRow}>
                    <Icon source="package-variant" size={16} color={colors.textSecondary} />
                    <Text variant="labelMedium" style={styles.label}>Category:</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>{item.category}</Text>
                  </View>
                )}

                {item.locationId && (
                  <View style={styles.detailRow}>
                    <Icon source="map-marker" size={16} color={colors.textSecondary} />
                    <Text variant="labelMedium" style={styles.label}>Location:</Text>
                    <Text variant="bodyMedium" numberOfLines={1} style={styles.detailValue}>{item.locationId}</Text>
                  </View>
                )}

                {item.building && (
                  <View style={styles.detailRow}>
                    <Icon source="office-building" size={16} color={colors.textSecondary} />
                    <Text variant="labelMedium" style={styles.label}>Building:</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>{item.building}</Text>
                  </View>
                )}

                {item.serviceStatus && (
                  <View style={styles.detailRow}>
                    <Icon source="wrench" size={16} color={colors.textSecondary} />
                    <Text variant="labelMedium" style={styles.label}>Service:</Text>
                    <Chip
                      compact
                      mode="flat"
                      style={[styles.serviceChip, { backgroundColor: getServiceStatusColor(item.serviceStatus) + '20' }]}
                      textStyle={{ color: getServiceStatusColor(item.serviceStatus), fontSize: 11, fontWeight: '600' }}
                    >
                      {item.serviceStatus.replace('-', ' ')}
                    </Chip>
                  </View>
                )}

                {item.nextServiceDue && (
                  <View style={styles.detailRow}>
                    <Icon source="calendar-clock" size={16} color={colors.textSecondary} />
                    <Text variant="labelMedium" style={styles.label}>Next Service:</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>{formatDisplayDate(item.nextServiceDue)}</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </LinearGradient>
        </Card>
      </TouchableOpacity>
    );
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
      {/* Header with gradient */}
      <LinearGradient
        colors={[colors.primary, colors.gradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {selectionMode ? `${selectedAssets.size} Selected` : `${filteredAssets.length} Assets`}
          </Text>
          {selectionMode && (
            <View style={styles.selectionActions}>
              <Button
                mode="text"
                textColor="#FFF"
                onPress={selectedAssets.size === filteredAssets.length ? deselectAll : selectAll}
                compact
              >
                {selectedAssets.size === filteredAssets.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                mode="text"
                textColor="#FFF"
                onPress={() => {
                  setSelectionMode(false);
                  setSelectedAssets(new Set());
                }}
                compact
              >
                Cancel
              </Button>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <Searchbar
        placeholder="Search assets by number, description, location..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        elevation={2}
        iconColor={colors.primary}
      />

      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Icon source="filter-variant" size={20} color={colors.primary} />
          <Text variant="labelLarge" style={styles.filterLabel}>Filters</Text>
        </View>
        <View style={styles.filterRow}>
        
          {/* Status Filters */}
          <Chip
            selected={statusFilter === 'in-use'}
            onPress={() => setStatusFilter(statusFilter === 'in-use' ? null : 'in-use')}
            style={styles.filterChip}
            compact
          >
            In Use
          </Chip>
          <Chip
            selected={statusFilter === 'spare'}
            onPress={() => setStatusFilter(statusFilter === 'spare' ? null : 'spare')}
            style={styles.filterChip}
            compact
          >
            Spare
          </Chip>
          <Chip
            selected={statusFilter === 'out-of-service'}
            onPress={() => setStatusFilter(statusFilter === 'out-of-service' ? null : 'out-of-service')}
            style={styles.filterChip}
            compact
          >
            Out of Service
          </Chip>

          {/* Category Menu */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Chip
                icon="chevron-down"
                onPress={() => setMenuVisible(true)}
                style={styles.filterChip}
                compact
                selected={categoryFilter !== null}
              >
                {categoryFilter || 'Category'}
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => {
                setCategoryFilter(null);
                setMenuVisible(false);
              }}
              title="All Categories"
            />
            {categories.map(cat => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategoryFilter(cat || null);
                  setMenuVisible(false);
                }}
                title={cat || 'Unknown'}
              />
            ))}
          </Menu>
        </View>
      </View>

      {/* Clear Filters */}
      {(statusFilter || categoryFilter || searchQuery) && (
        <Button
          mode="text"
          onPress={() => {
            setStatusFilter(null);
            setCategoryFilter(null);
            setSearchQuery('');
          }}
          style={styles.clearButton}
          compact
        >
          Clear all filters
        </Button>
      )}

      {/* Results Count */}
      <Text variant="bodySmall" style={styles.resultsCount}>
        Showing {filteredAssets.length} of {assets.length} assets
      </Text>

      {/* Asset List */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredAssets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="titleMedium">No assets found</Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Try adjusting your filters or import some assets
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssets}
          renderItem={renderAssetCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB for adding new asset or bulk delete */}
      {selectionMode && selectedAssets.size > 0 && (
        <FAB
          icon="delete"

          style={[styles.deleteFab, { backgroundColor: '#FF6B6B' }]}
          onPress={handleBulkDelete}
          label={`Delete ${selectedAssets.size}`}
        />
      )}
      
      {!selectionMode && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('EditAsset', {})}
          label="Add"
        />
      )}
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
  loadingText: {
    marginTop: spacing.md,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchBar: {
    margin: spacing.md,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  filterLabel: {
    fontWeight: '600',
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
  },
  resultsCount: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    opacity: 0.7,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#2C3E50', // Primary color
  },
  cardGradient: {
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  assetNumber: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  statusChip: {
    marginLeft: spacing.sm,
  },
  cardDetails: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontWeight: '600',
    minWidth: 80,
    opacity: 0.7,
  },
  detailValue: {
    flex: 1,
    fontWeight: '500',
  },
  serviceSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  serviceChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptySubtext: {
    marginTop: spacing.sm,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  deleteFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#C62828',
  },
});
