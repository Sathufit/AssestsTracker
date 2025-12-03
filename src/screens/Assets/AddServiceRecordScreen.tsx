/**
 * Professional Add Service Record Screen
 * Record maintenance and service events for assets
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, SegmentedButtons, Icon } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, ServiceRecordFormValues } from '../../types';
import { addServiceRecord } from '../../api/assets';
import { useAuth } from '../../hooks';

type Props = NativeStackScreenProps<MainStackParamList, 'AddServiceRecord'>;

export default function AddServiceRecordScreen({ route, navigation }: Props) {
  const { assetId } = route.params;
  const theme = useTheme();
  const colors = theme.colors as any;
  const { user } = useAuth();

  const [form, setForm] = useState<ServiceRecordFormValues>({
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: 'routine',
    description: '',
    performedBy: '',
    cost: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a service description');
      return;
    }

    if (!form.performedBy.trim()) {
      Alert.alert('Validation Error', 'Please enter technician name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      await addServiceRecord(assetId, form, user.uid, user.email || 'Unknown User');

      Alert.alert('Success', 'Service record added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding service record:', error);
      Alert.alert('Error', 'Failed to add service record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <View style={styles.header}>
            <Icon source="wrench" size={32} color={colors.primary} />
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.title}>
                Add Service Record
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.secondary }}>
                Document maintenance and service events
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Service Date</Text>
            <TextInput
              mode="outlined"
              value={form.serviceDate}
              onChangeText={(text) => setForm({ ...form, serviceDate: text })}
              placeholder="YYYY-MM-DD"
              left={<TextInput.Icon icon="calendar" />}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Service Type</Text>
            <SegmentedButtons
              value={form.serviceType}
              onValueChange={(value) => setForm({ ...form, serviceType: value as ServiceRecordFormValues['serviceType'] })}
              buttons={[
                { value: 'routine', label: 'Routine' },
                { value: 'repair', label: 'Repair' },
                { value: 'calibration', label: 'Calibration' },
                { value: 'inspection', label: 'Inspection' },
                { value: 'cleaning', label: 'Cleaning' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Description *</Text>
            <TextInput
              mode="outlined"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              placeholder="What service was performed?"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="text" />}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Technician *</Text>
            <TextInput
              mode="outlined"
              value={form.performedBy}
              onChangeText={(text) => setForm({ ...form, performedBy: text })}
              placeholder="Name of technician"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.label}>Cost</Text>
            <TextInput
              mode="outlined"
              value={form.cost}
              onChangeText={(text) => setForm({ ...form, cost: text })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon="currency-usd" />}
              style={styles.input}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              Save Record
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
