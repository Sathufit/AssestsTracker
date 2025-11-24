/**
 * Firebase API Layer - Assets Management
 * CRUD operations, history tracking, queries, and offline support
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseDB, getFirebaseStorage, COLLECTIONS, SUBCOLLECTIONS } from '../firebase/config';
import {
  Asset,
  AssetHistory,
  ServiceRecord,
  AssetFormValues,
  ServiceRecordFormValues,
  AssetLocation,
} from '../types';
import {
  getCurrentISOString,
  calculateNextServiceDue,
  getServiceStatus,
  compressImage,
  generateUniqueId,
  parseCurrency,
  parseServiceFrequency,
} from '../utils/helpers';

const db = getFirebaseDB();
const storage = getFirebaseStorage();

// ============================================
// Asset CRUD Operations
// ============================================

/**
 * Create a new asset
 */
export const createAsset = async (
  formValues: AssetFormValues,
  userId: string,
  userName: string
): Promise<Asset> => {
  try {
    const assetId = generateUniqueId();
    const now = getCurrentISOString();
    
    // Calculate next service due if applicable
    const nextServiceDue = calculateNextServiceDue(
      formValues.lastServiceDate,
      parseServiceFrequency(formValues.serviceFrequency)
    );
    
    // Build asset object
    const asset: Asset = {
      id: assetId,
      assetId: formValues.assetId.trim(),
      qrCode: formValues.qrCode.trim(),
      category: formValues.category.trim(),
      assetType: formValues.assetType.trim(),
      manufacturer: formValues.manufacturer?.trim() || undefined,
      model: formValues.model?.trim() || undefined,
      serialNumber: formValues.serialNumber?.trim() || undefined,
      ownership: formValues.ownership,
      status: formValues.status,
      locationType: formValues.locationType,
      locationId: formValues.locationId.trim(),
      dateAssigned: now,
      condition: formValues.condition,
      outOfServiceReason: formValues.outOfServiceReason?.trim() || undefined,
      serviceFrequency: formValues.serviceFrequency?.trim() || undefined,
      lastServiceDate: formValues.lastServiceDate || undefined,
      nextServiceDue,
      calibrationRequired: formValues.calibrationRequired,
      calibrationFrequency: formValues.calibrationFrequency?.trim() || undefined,
      safeWorkingLoad: formValues.safeWorkingLoad ? parseFloat(formValues.safeWorkingLoad) : undefined,
      imageUrls: [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      serviceStatus: getServiceStatus(nextServiceDue),
    };
    
    // Remove undefined values (Firebase doesn't accept them)
    const cleanedAsset = Object.fromEntries(
      Object.entries(asset).filter(([_, v]) => v !== undefined)
    ) as Asset;
    
    // Save to Firestore
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    await setDoc(assetRef, cleanedAsset);
    
    // Add history entry
    await addHistoryEntry(assetId, {
      userId,
      userName,
      action: 'created',
      description: `Asset created: ${asset.assetType} (${asset.assetId})`,
    });
    
    console.log('✅ Asset created successfully:', assetId);
    return asset;
  } catch (error) {
    console.error('❌ Error creating asset:', error);
    throw new Error('Failed to create asset');
  }
};

/**
 * Get asset by ID
 */
export const getAssetById = async (assetId: string): Promise<Asset | null> => {
  try {
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    const assetDoc = await getDoc(assetRef);
    
    if (!assetDoc.exists()) {
      return null;
    }
    
    return assetDoc.data() as Asset;
  } catch (error) {
    console.error('❌ Error getting asset:', error);
    throw new Error('Failed to get asset');
  }
};

/**
 * Get asset by QR code
 */
export const getAssetByQRCode = async (qrCode: string): Promise<Asset | null> => {
  try {
    const assetsRef = collection(db, COLLECTIONS.ASSETS);
    const q = query(assetsRef, where('qrCode', '==', qrCode), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data() as Asset;
  } catch (error) {
    console.error('❌ Error getting asset by QR code:', error);
    throw new Error('Failed to get asset by QR code');
  }
};

/**
 * Update asset
 */
export const updateAsset = async (
  assetId: string,
  formValues: Partial<AssetFormValues>,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    const now = getCurrentISOString();
    
    // Get current asset for comparison
    const currentAsset = await getAssetById(assetId);
    if (!currentAsset) {
      throw new Error('Asset not found');
    }
    
    // Build update object
    const updateData: Partial<Asset> = {
      updatedAt: now,
      updatedBy: userId,
    };
    
    // Update fields if provided
    if (formValues.assetId) updateData.assetId = formValues.assetId.trim();
    if (formValues.qrCode) updateData.qrCode = formValues.qrCode.trim();
    if (formValues.category) updateData.category = formValues.category.trim();
    if (formValues.assetType) updateData.assetType = formValues.assetType.trim();
    if (formValues.manufacturer !== undefined) updateData.manufacturer = formValues.manufacturer?.trim();
    if (formValues.model !== undefined) updateData.model = formValues.model?.trim();
    if (formValues.serialNumber !== undefined) updateData.serialNumber = formValues.serialNumber?.trim();
    if (formValues.ownership) updateData.ownership = formValues.ownership;
    if (formValues.condition) updateData.condition = formValues.condition;
    if (formValues.status) updateData.status = formValues.status;
    if (formValues.outOfServiceReason !== undefined) updateData.outOfServiceReason = formValues.outOfServiceReason?.trim();
    if (formValues.calibrationRequired !== undefined) updateData.calibrationRequired = formValues.calibrationRequired;
    if (formValues.safeWorkingLoad !== undefined) {
      updateData.safeWorkingLoad = formValues.safeWorkingLoad ? parseFloat(formValues.safeWorkingLoad) : undefined;
    }
    
    // Update location if provided
    if (formValues.locationType) updateData.locationType = formValues.locationType;
    if (formValues.locationId) updateData.locationId = formValues.locationId.trim();
    
    // Update maintenance fields
    if (formValues.serviceFrequency !== undefined) {
      updateData.serviceFrequency = formValues.serviceFrequency?.trim();
    }
    if (formValues.calibrationFrequency !== undefined) {
      updateData.calibrationFrequency = formValues.calibrationFrequency?.trim();
    }
    if (formValues.lastServiceDate !== undefined) {
      updateData.lastServiceDate = formValues.lastServiceDate;
    }
    
    // Recalculate next service due
    if (formValues.lastServiceDate !== undefined || formValues.serviceFrequency !== undefined) {
      const lastDate = formValues.lastServiceDate || currentAsset.lastServiceDate;
      const frequency = formValues.serviceFrequency || currentAsset.serviceFrequency;
      
      updateData.nextServiceDue = calculateNextServiceDue(lastDate, parseServiceFrequency(frequency));
      updateData.serviceStatus = getServiceStatus(updateData.nextServiceDue);
    }
    
    // Update in Firestore
    await updateDoc(assetRef, updateData);
    
    // Track changes in history
    await trackChanges(assetId, currentAsset, updateData, userId, userName);
    
    console.log('✅ Asset updated successfully:', assetId);
  } catch (error) {
    console.error('❌ Error updating asset:', error);
    throw new Error('Failed to update asset');
  }
};

/**
 * Delete asset (soft delete by marking as retired)
 */
export const deleteAsset = async (
  assetId: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    
    await updateDoc(assetRef, {
      status: 'retired',
      updatedAt: getCurrentISOString(),
      updatedBy: userId,
    });
    
    await addHistoryEntry(assetId, {
      userId,
      userName,
      action: 'status-changed',
      description: 'Asset retired/deleted',
      oldValue: 'active',
      newValue: 'retired',
    });
    
    console.log('✅ Asset deleted (retired):', assetId);
  } catch (error) {
    console.error('❌ Error deleting asset:', error);
    throw new Error('Failed to delete asset');
  }
};

// ============================================
// Asset Queries
// ============================================

/**
 * Get all assets with optional filters
 */
export const getAssets = async (filters?: {
  status?: string;
  category?: string;
  serviceStatus?: string;
  limit?: number;
}): Promise<Asset[]> => {
  try {
    const assetsRef = collection(db, COLLECTIONS.ASSETS);
    const constraints: QueryConstraint[] = [];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters?.serviceStatus) {
      constraints.push(where('serviceStatus', '==', filters.serviceStatus));
    }
    
    constraints.push(orderBy('updatedAt', 'desc'));
    
    if (filters?.limit) {
      constraints.push(limit(filters.limit));
    }
    
    const q = query(assetsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as Asset);
  } catch (error) {
    console.error('❌ Error getting assets:', error);
    throw new Error('Failed to get assets');
  }
};

/**
 * Get assets due for service soon (within 30 days)
 */
export const getAssetsDueSoon = async (): Promise<Asset[]> => {
  try {
    const assets = await getAssets();
    return assets.filter(asset => asset.serviceStatus === 'due-soon' || asset.serviceStatus === 'overdue');
  } catch (error) {
    console.error('❌ Error getting assets due soon:', error);
    throw new Error('Failed to get assets due soon');
  }
};

/**
 * Search assets by name, QR code, or serial number
 */
export const searchAssets = async (searchTerm: string): Promise<Asset[]> => {
  try {
    const assets = await getAssets();
    const lowerSearch = searchTerm.toLowerCase();
    
    return assets.filter(asset => 
      asset.assetType.toLowerCase().includes(lowerSearch) ||
      asset.assetId.toLowerCase().includes(lowerSearch) ||
      asset.qrCode.toLowerCase().includes(lowerSearch) ||
      asset.serialNumber?.toLowerCase().includes(lowerSearch) ||
      asset.category.toLowerCase().includes(lowerSearch)
    );
  } catch (error) {
    console.error('❌ Error searching assets:', error);
    throw new Error('Failed to search assets');
  }
};

/**
 * Subscribe to assets changes (real-time)
 */
export const subscribeToAssets = (
  callback: (assets: Asset[]) => void,
  filters?: { status?: string; category?: string }
): Unsubscribe => {
  const assetsRef = collection(db, COLLECTIONS.ASSETS);
  const constraints: QueryConstraint[] = [];
  
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  
  constraints.push(orderBy('updatedAt', 'desc'));
  
  const q = query(assetsRef, ...constraints);
  
  return onSnapshot(q, (querySnapshot) => {
    const assets = querySnapshot.docs.map(doc => doc.data() as Asset);
    callback(assets);
  }, (error) => {
    console.error('❌ Error in assets subscription:', error);
  });
};

/**
 * Subscribe to single asset changes
 */
export const subscribeToAsset = (
  assetId: string,
  callback: (asset: Asset | null) => void
): Unsubscribe => {
  const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
  
  return onSnapshot(assetRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback(docSnapshot.data() as Asset);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('❌ Error in asset subscription:', error);
  });
};

// ============================================
// History/Audit Trail
// ============================================

interface HistoryEntryData {
  userId: string;
  userName: string;
  action: AssetHistory['action'];
  description: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Add history entry for asset
 */
export const addHistoryEntry = async (
  assetId: string,
  data: HistoryEntryData
): Promise<void> => {
  try {
    const historyId = generateUniqueId();
    const historyEntry: AssetHistory = {
      id: historyId,
      assetId,
      timestamp: getCurrentISOString(),
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      field: data.field,
      oldValue: data.oldValue,
      newValue: data.newValue,
      description: data.description,
    };
    
    const historyRef = doc(
      db,
      COLLECTIONS.ASSETS,
      assetId,
      SUBCOLLECTIONS.HISTORY,
      historyId
    );
    
    await setDoc(historyRef, historyEntry);
  } catch (error) {
    console.error('❌ Error adding history entry:', error);
    // Don't throw - history is non-critical
  }
};

/**
 * Get asset history
 */
export const getAssetHistory = async (assetId: string): Promise<AssetHistory[]> => {
  try {
    const historyRef = collection(db, COLLECTIONS.ASSETS, assetId, SUBCOLLECTIONS.HISTORY);
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as AssetHistory);
  } catch (error) {
    console.error('❌ Error getting asset history:', error);
    return [];
  }
};

/**
 * Track changes between old and new asset data
 */
const trackChanges = async (
  assetId: string,
  oldAsset: Asset,
  newData: Partial<Asset>,
  userId: string,
  userName: string
): Promise<void> => {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  
  // Check each field for changes
  Object.keys(newData).forEach(key => {
    if (key === 'updatedAt' || key === 'updatedBy') return;
    
    const oldValue = (oldAsset as any)[key];
    const newValue = (newData as any)[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ field: key, oldValue, newValue });
    }
  });
  
  // Add history entries for each change
  for (const change of changes) {
    let description = `Updated ${change.field}`;
    let action: AssetHistory['action'] = 'updated';
    
    if (change.field === 'status') {
      action = 'status-changed';
      description = `Status changed from ${change.oldValue} to ${change.newValue}`;
    } else if (change.field === 'location') {
      action = 'location-changed';
      description = `Location changed`;
    }
    
    await addHistoryEntry(assetId, {
      userId,
      userName,
      action,
      description,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
    });
  }
};

// ============================================
// Service Records
// ============================================

/**
 * Add service record to asset
 */
export const addServiceRecord = async (
  assetId: string,
  formValues: ServiceRecordFormValues,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const serviceId = generateUniqueId();
    const now = getCurrentISOString();
    
    const serviceRecord: ServiceRecord = {
      id: serviceId,
      assetId,
      serviceDate: formValues.serviceDate,
      serviceType: formValues.serviceType,
      performedBy: formValues.performedBy.trim(),
      description: formValues.description.trim(),
      cost: parseCurrency(formValues.cost),
      createdAt: now,
      createdBy: userId,
    };
    
    // Get current asset
    const asset = await getAssetById(assetId);
    if (!asset) throw new Error('Asset not found');
    
    // Calculate next service due based on service frequency
    if (asset.serviceFrequency) {
      serviceRecord.nextServiceDue = calculateNextServiceDue(
        formValues.serviceDate,
        parseServiceFrequency(asset.serviceFrequency)
      );
    }
    
    // Save service record
    const serviceRef = doc(db, COLLECTIONS.SERVICE_RECORDS, serviceId);
    await setDoc(serviceRef, serviceRecord);
    
    // Update asset's last service date and next due date
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    const updateData: Partial<Asset> = {
      lastServiceDate: formValues.serviceDate,
      nextServiceDue: serviceRecord.nextServiceDue,
      serviceStatus: getServiceStatus(serviceRecord.nextServiceDue),
      updatedAt: now,
      updatedBy: userId,
    };
    
    await updateDoc(assetRef, updateData);
    
    // Add history entry
    await addHistoryEntry(assetId, {
      userId,
      userName,
      action: 'service-completed',
      description: `Service completed: ${formValues.serviceType} by ${formValues.performedBy}`,
    });
    
    console.log('✅ Service record added successfully');
  } catch (error) {
    console.error('❌ Error adding service record:', error);
    throw new Error('Failed to add service record');
  }
};

/**
 * Get service records for an asset
 */
export const getServiceRecords = async (assetId: string): Promise<ServiceRecord[]> => {
  try {
    const recordsRef = collection(db, COLLECTIONS.SERVICE_RECORDS);
    const q = query(
      recordsRef,
      where('assetId', '==', assetId),
      orderBy('serviceDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as ServiceRecord);
  } catch (error) {
    console.error('❌ Error getting service records:', error);
    return [];
  }
};

// ============================================
// Image Management
// ============================================

/**
 * Upload image to Firebase Storage
 */
export const uploadAssetImage = async (
  assetId: string,
  imageUri: string,
  userId: string,
  userName: string
): Promise<string> => {
  try {
    // Compress image before upload
    const compressedUri = await compressImage(imageUri, 0.7);
    
    // Convert to blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();
    
    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const storageRef = ref(storage, `assets/${assetId}/${filename}`);
    
    // Upload
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update asset's imageUrls array
    const asset = await getAssetById(assetId);
    if (asset) {
      const updatedImageUrls = [...asset.imageUrls, downloadURL];
      const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
      await updateDoc(assetRef, {
        imageUrls: updatedImageUrls,
        updatedAt: getCurrentISOString(),
        updatedBy: userId,
      });
      
      // Add history entry
      await addHistoryEntry(assetId, {
        userId,
        userName,
        action: 'image-added',
        description: 'Image uploaded',
      });
    }
    
    console.log('✅ Image uploaded successfully');
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Delete image from Firebase Storage and asset record
 */
export const deleteAssetImage = async (
  assetId: string,
  imageUrl: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    
    // Update asset's imageUrls array
    const asset = await getAssetById(assetId);
    if (asset) {
      const updatedImageUrls = asset.imageUrls.filter(url => url !== imageUrl);
      const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
      await updateDoc(assetRef, {
        imageUrls: updatedImageUrls,
        updatedAt: getCurrentISOString(),
        updatedBy: userId,
      });
      
      // Add history entry
      await addHistoryEntry(assetId, {
        userId,
        userName,
        action: 'image-removed',
        description: 'Image deleted',
      });
    }
    
    console.log('✅ Image deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
};

// ============================================
// Quick Actions
// ============================================

/**
 * Assign asset to room
 */
export const assignToRoom = async (
  assetId: string,
  roomNumber: string,
  building?: string,
  floor?: string,
  userId?: string,
  userName?: string
): Promise<void> => {
  try {
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    await updateDoc(assetRef, {
      locationType: 'rac-room',
      locationId: roomNumber,
      status: 'in-use',
      dateAssigned: getCurrentISOString(),
      updatedAt: getCurrentISOString(),
      updatedBy: userId,
    });
    
    if (userId && userName) {
      await addHistoryEntry(assetId, {
        userId,
        userName,
        action: 'location-changed',
        description: `Assigned to room ${roomNumber}`,
      });
    }
  } catch (error) {
    console.error('❌ Error assigning to room:', error);
    throw new Error('Failed to assign to room');
  }
};

/**
 * Mark asset as spare
 */
export const markAsSpare = async (
  assetId: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    await updateDoc(assetRef, {
      locationType: 'storage',
      locationId: 'Spare Storage',
      status: 'spare',
      updatedAt: getCurrentISOString(),
      updatedBy: userId,
    });
    
    await addHistoryEntry(assetId, {
      userId,
      userName,
      action: 'status-changed',
      description: 'Marked as spare',
    });
  } catch (error) {
    console.error('❌ Error marking as spare:', error);
    throw new Error('Failed to mark as spare');
  }
};

/**
 * Mark asset as out of service
 */
export const markOutOfService = async (
  assetId: string,
  reason: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const assetRef = doc(db, COLLECTIONS.ASSETS, assetId);
    await updateDoc(assetRef, {
      status: 'out-of-service',
      outOfServiceReason: reason,
      updatedAt: getCurrentISOString(),
      updatedBy: userId,
    });
    
    await addHistoryEntry(assetId, {
      userId,
      userName,
      action: 'status-changed',
      description: `Marked out of service: ${reason}`,
    });
  } catch (error) {
    console.error('❌ Error marking out of service:', error);
    throw new Error('Failed to mark out of service');
  }
};
