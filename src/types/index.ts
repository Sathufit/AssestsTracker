/**
 * Core Type Definitions for AssetTracker
 * Asset tracking for Residential Aged Care facilities
 */

// ============================================
// Asset Types
// ============================================

export type AssetStatus = 'in-use' | 'spare' | 'out-of-service' | 'under-repair' | 'missing';
export type ServiceStatus = 'current' | 'due-soon' | 'overdue';
export type LocationType = 'rac-room' | 'ilu-apartment' | 'storage' | 'common-area';
export type Ownership = 'facility-owned' | 'hire' | 'resident-owned';
export type Condition = 'good' | 'fair' | 'poor';

export interface Asset {
  id: string; // Firestore document ID
  
  // Basic Information - Matching your Excel structure
  assetNumber?: string; // Asset number from Excel
  description?: string; // Description from Excel
  assetRegister?: string; // Asset Register from Excel (e.g., "OPASSET")
  shortDescription?: string; // Short Description from Excel
  commissionDate?: string; // Commission Date from Excel
  manufacturer?: string; // Manufacturer from Excel
  model?: string; // Model from Excel
  supplyCondition?: string; // Supply Condition from Excel (e.g., "New", "Used", "Repaired")
  
  // Legacy/Optional fields for compatibility
  qrCode?: string; // QR code value (auto-generated from assetNumber if missing)
  category?: string; // Category (optional)
  status?: AssetStatus; // Status (optional)
  locationType?: LocationType; // Location type (optional)
  locationId?: string; // Location ID (optional)
  condition?: Condition; // Condition (optional)
  ownership?: Ownership; // Ownership (optional)
  serialNumber?: string; // Serial number (optional)
  
  // Location details
  dateAssigned?: string; // Date assigned to current location
  building?: string; // Building name
  floor?: string; // Floor number
  outOfServiceReason?: string; // Reason if status is out-of-service
  
  // Service fields (all optional)
  serviceFrequency?: string;
  lastServiceDate?: string;
  nextServiceDue?: string;
  calibrationRequired?: boolean;
  calibrationFrequency?: string;
  safeWorkingLoad?: number;
  
  // Images
  imageUrls?: string[]; // Firebase Storage URLs
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // User ID
  updatedBy: string; // User ID
  
  // Computed fields
  serviceStatus?: ServiceStatus;
}

export interface AssetLocation {
  type: LocationType;
  locationId: string;
  building?: string;
  floor?: string;
  notes?: string;
}

// ============================================
// Service Record Types
// ============================================

export interface ServiceRecord {
  id: string;
  assetId: string;
  serviceDate: string; // ISO date string
  serviceType: 'routine' | 'repair' | 'calibration' | 'inspection' | 'cleaning';
  performedBy: string;
  description: string;
  cost?: number;
  nextServiceDue?: string; // ISO date string
  attachments?: string[]; // URLs to photos/documents
  createdAt: string;
  createdBy: string;
}

// ============================================
// History/Audit Trail Types
// ============================================

export interface AssetHistory {
  id: string;
  assetId: string;
  timestamp: string; // ISO date string
  userId: string;
  userName: string;
  action: HistoryAction;
  field?: string; // Field that was changed
  oldValue?: any;
  newValue?: any;
  description: string; // Human-readable description
}

export type HistoryAction = 
  | 'created'
  | 'updated'
  | 'status-changed'
  | 'location-changed'
  | 'service-completed'
  | 'image-added'
  | 'deleted'
  | 'image-removed';

// ============================================
// Import Job Types
// ============================================

export interface ImportJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  startedAt: string;
  completedAt?: string;
  createdBy: string;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportAssetData {
  qrCode: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: string | number;
  roomNumber?: string;
  building?: string;
  floor?: string;
  status?: string;
  serviceFrequency?: string | number;
  calibrationRequired?: string | boolean;
  safeWorkingLoad?: string | number;
}

// ============================================
// User Types
// ============================================

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

// ============================================
// Dashboard Types
// ============================================

export interface DashboardSummary {
  totalAssets: number;
  activeAssets: number;
  spareAssets: number;
  outOfServiceAssets: number;
  
  // Service status
  currentAssets: number; // Service is current
  dueSoonAssets: number; // Due within 30 days
  overdueAssets: number; // Past due date
  
  // By category
  assetsByCategory: Record<string, number>;
  
  // Recent activity
  recentServices: number; // Last 7 days
  recentUpdates: number; // Last 24 hours
  
  lastUpdated: string;
}

// ============================================
// Offline Queue Types
// ============================================

export interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

// ============================================
// Form Types
// ============================================

export interface AssetFormValues {
  // Core fields matching Excel structure
  assetNumber?: string; // Asset number
  description?: string; // Description
  assetRegister?: string; // Asset Register (e.g., "OPASSET")
  shortDescription?: string; // Short Description
  commissionDate?: string; // Commission Date
  manufacturer?: string; // Manufacturer
  model?: string; // Model
  supplyCondition?: string; // Supply Condition (e.g., "New", "Used", "Repaired")
  
  // Optional legacy fields
  qrCode?: string;
  category?: string;
  status?: AssetStatus;
  condition?: Condition;
  ownership?: Ownership;
  serialNumber?: string;
  locationType?: LocationType;
  locationId?: string;
  
  // Location details
  dateAssigned?: string;
  building?: string;
  floor?: string;
  outOfServiceReason?: string;
  
  // Service fields (all optional)
  serviceFrequency?: string;
  lastServiceDate?: string;
  calibrationRequired?: boolean;
  calibrationFrequency?: string;
  safeWorkingLoad?: string;
}

export interface ServiceRecordFormValues {
  serviceDate: string;
  serviceType: ServiceRecord['serviceType'];
  performedBy: string;
  description: string;
  cost: string;
}

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  AssetList: { filter?: string } | undefined;
  Scanner: undefined;
  AssetDetails: { assetId: string };
  EditAsset: { assetId?: string };
  AddServiceRecord: { assetId: string };
  Import: undefined;
  Dashboard: undefined;
};

// ============================================
// Theme Types
// ============================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  disabled: string;
}

export type ThemeMode = 'light' | 'dark';
