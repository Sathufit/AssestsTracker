/**
 * Edit Asset Screen  
 * Form for creating/editing assets with validation
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Switch, Text, useTheme } from 'react-native-paper';
import { Formik } from 'formik';
import { createAsset, updateAsset, getAssetById } from '../../api/assets';
import { assetValidationSchema } from '../../utils/validation';
import { AssetFormValues } from '../../types';
import { spacing } from '../../theme';
import { useAuth } from '../../hooks';

export default function EditAssetScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { user } = useAuth();
  const { assetId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<AssetFormValues>({
    qrCode: '',
    assetId: '',
    assetType: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'in-use',
    outOfServiceReason: '',
    locationType: 'rac-room',
    locationId: '',
    building: '',
    floor: '',
    ownership: 'facility-owned',
    condition: 'good',
    locationNotes: '',
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
          qrCode: asset.qrCode,
          assetId: asset.assetId,
          assetType: asset.assetType,
          category: asset.category,
          manufacturer: asset.manufacturer || '',
          model: asset.model || '',
          serialNumber: asset.serialNumber || '',
          status: asset.status,
          condition: asset.condition,
          outOfServiceReason: asset.outOfServiceReason || '',
          ownership: asset.ownership,
          locationType: asset.locationType,
          locationId: asset.locationId || '',
          building: '',
          floor: '',
          locationNotes: '',
          serviceFrequency: asset.serviceFrequency || '',
          lastServiceDate: asset.lastServiceDate || '',
          calibrationRequired: asset.calibrationRequired,
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
        validationSchema={assetValidationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <ScrollView contentContainerStyle={styles.content}>
            {/* Basic Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>
            
            <TextInput
              label="QR Code *"
              value={values.qrCode}
              onChangeText={handleChange('qrCode')}
              onBlur={handleBlur('qrCode')}
              error={touched.qrCode && !!errors.qrCode}
              style={styles.input}
              mode="outlined"
            />
            {touched.qrCode && errors.qrCode && <Text style={styles.errorText}>{errors.qrCode}</Text>}

            <TextInput
              label="Asset ID (Tag Number) *"
              value={values.assetId}
              onChangeText={handleChange('assetId')}
              onBlur={handleBlur('assetId')}
              error={touched.assetId && !!errors.assetId}
              style={styles.input}
              mode="outlined"
            />
            {touched.assetId && errors.assetId && <Text style={styles.errorText}>{errors.assetId}</Text>}

            <TextInput
              label="Asset Type *"
              value={values.assetType}
              onChangeText={handleChange('assetType')}
              onBlur={handleBlur('assetType')}
              error={touched.assetType && !!errors.assetType}
              style={styles.input}
              mode="outlined"
            />
            {touched.assetType && errors.assetType && <Text style={styles.errorText}>{errors.assetType}</Text>}

            <TextInput
              label="Category *"
              value={values.category}
              onChangeText={handleChange('category')}
              onBlur={handleBlur('category')}
              error={touched.category && !!errors.category}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Manufacturer"
              value={values.manufacturer}
              onChangeText={handleChange('manufacturer')}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Model"
              value={values.model}
              onChangeText={handleChange('model')}
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

            {/* Location */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Location</Text>
            
            <TextInput
              label="Location ID (e.g., G08, ILU 204)"
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

            {/* Maintenance */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Maintenance</Text>
            
            <TextInput
              label="Service Frequency (days)"
              value={values.serviceFrequency}
              onChangeText={handleChange('serviceFrequency')}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.switchRow}>
              <Text>Calibration Required</Text>
              <Switch
                value={values.calibrationRequired}
                onValueChange={(value) => { setFieldValue('calibrationRequired', value); }}
              />
            </View>

            <TextInput
              label="Safe Working Load (kg)"
              value={values.safeWorkingLoad}
              onChangeText={handleChange('safeWorkingLoad')}
              keyboardType="numeric"
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
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
