/**
 * Edit Asset Screen  
 * Form for creating/editing assets - No validation, all fields optional
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { Formik } from 'formik';
import { createAsset, updateAsset, getAssetById } from '../../api/assets';
import { AssetFormValues } from '../../types';
import { spacing } from '../../theme';
import { useAuth } from '../../hooks';

export default function EditAssetScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  const { assetId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<AssetFormValues>({
    assetNumber: '',
    description: '',
    assetRegister: '',
    shortDescription: '',
    commissionDate: '',
    manufacturer: '',
    model: '',
    supplyCondition: '',
    qrCode: '',
    category: '',
    serialNumber: '',
    status: undefined,
    condition: undefined,
    ownership: undefined,
    locationType: undefined,
    locationId: '',
    dateAssigned: '',
    building: '',
    floor: '',
    outOfServiceReason: '',
    serviceFrequency: '',
    lastServiceDate: '',
    calibrationRequired: false,
    calibrationFrequency: '',
    safeWorkingLoad: '',
  });

  useEffect(() => {
    if (assetId) {
      loadAsset();
    }
  }, [assetId]);

  const loadAsset = async () => {
    try {
      const asset = await getAssetById(assetId);
      if (asset) {
        setInitialValues({
          assetNumber: asset.assetNumber || '',
          description: asset.description || '',
          assetRegister: asset.assetRegister || '',
          shortDescription: asset.shortDescription || '',
          commissionDate: asset.commissionDate || '',
          manufacturer: asset.manufacturer || '',
          model: asset.model || '',
          supplyCondition: asset.supplyCondition || '',
          qrCode: asset.qrCode || '',
          category: asset.category || '',
          serialNumber: asset.serialNumber || '',
          status: asset.status,
          condition: asset.condition,
          ownership: asset.ownership,
          locationType: asset.locationType,
          locationId: asset.locationId || '',
          dateAssigned: asset.dateAssigned || '',
          building: asset.building || '',
          floor: asset.floor || '',
          outOfServiceReason: asset.outOfServiceReason || '',
          serviceFrequency: asset.serviceFrequency || '',
          lastServiceDate: asset.lastServiceDate || '',
          calibrationRequired: asset.calibrationRequired || false,
          calibrationFrequency: asset.calibrationFrequency || '',
          safeWorkingLoad: asset.safeWorkingLoad?.toString() || '',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load asset');
    }
  };

  const handleSubmit = async (values: AssetFormValues) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      if (assetId) {
        await updateAsset(assetId, values, user.uid, user.displayName || user.email || 'Unknown');
        Alert.alert('Success', 'Asset updated successfully');
      } else {
        await createAsset(values, user.uid, user.displayName || user.email || 'Unknown');
        Alert.alert('Success', 'Asset created successfully');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <ScrollView contentContainerStyle={styles.content}>
            {/* Core Information - Matching Excel Structure */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Asset Information</Text>
            
            <TextInput
              label="Asset Number"
              value={values.assetNumber}
              onChangeText={handleChange('assetNumber')}
              onBlur={handleBlur('assetNumber')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              multiline
              numberOfLines={2}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Asset Register"
              value={values.assetRegister}
              onChangeText={handleChange('assetRegister')}
              onBlur={handleBlur('assetRegister')}
              placeholder="e.g., OPASSET"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Short Description"
              value={values.shortDescription}
              onChangeText={handleChange('shortDescription')}
              onBlur={handleBlur('shortDescription')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Commission Date"
              value={values.commissionDate}
              onChangeText={handleChange('commissionDate')}
              onBlur={handleBlur('commissionDate')}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Manufacturer"
              value={values.manufacturer}
              onChangeText={handleChange('manufacturer')}
              onBlur={handleBlur('manufacturer')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Model"
              value={values.model}
              onChangeText={handleChange('model')}
              onBlur={handleBlur('model')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Supply Condition"
              value={values.supplyCondition}
              onChangeText={handleChange('supplyCondition')}
              onBlur={handleBlur('supplyCondition')}
              placeholder="e.g., New, Used, Repaired"
              style={styles.input}
              mode="outlined"
            />

            {/* Optional Fields */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Information (Optional)</Text>
            
            <TextInput
              label="QR Code"
              value={values.qrCode}
              onChangeText={handleChange('qrCode')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Category"
              value={values.category}
              onChangeText={handleChange('category')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Serial Number"
              value={values.serialNumber}
              onChangeText={handleChange('serialNumber')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Location ID"
              value={values.locationId}
              onChangeText={handleChange('locationId')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Building"
              value={values.building}
              onChangeText={handleChange('building')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Floor"
              value={values.floor}
              onChangeText={handleChange('floor')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Date Assigned"
              value={values.dateAssigned}
              onChangeText={handleChange('dateAssigned')}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Out of Service Reason"
              value={values.outOfServiceReason}
              onChangeText={handleChange('outOfServiceReason')}
              multiline
              numberOfLines={2}
              style={styles.input}
              mode="outlined"
            />

            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              {assetId ? 'Update Asset' : 'Create Asset'}
            </Button>
          </ScrollView>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
