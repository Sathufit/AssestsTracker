/**
 * Utility Functions and Helpers
 * Date handling, validation, image processing, and general utilities
 */

import { format, parseISO, addDays, differenceInDays, isAfter, isBefore } from 'date-fns';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Asset, ServiceStatus, AssetStatus } from '../types';

// ============================================
// Date Utilities
// ============================================

/**
 * Get current date/time as ISO string
 */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

/**
 * Format ISO date string to readable format
 */
export const formatDate = (isoString: string | undefined, formatStr: string = 'PP'): string => {
  if (!isoString) return 'N/A';
  try {
    return format(parseISO(isoString), formatStr);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * Format date for display (e.g., "21 Nov 2025")
 */
export const formatDisplayDate = (isoString: string | undefined): string => {
  return formatDate(isoString, 'd MMM yyyy');
};

/**
 * Format date for forms (e.g., "2025-11-21")
 */
export const formatFormDate = (isoString: string | undefined): string => {
  return formatDate(isoString, 'yyyy-MM-dd');
};

/**
 * Parse service frequency string to days
 * @param frequency - e.g., "6-monthly", "12-monthly", "90" (days), "180"
 * @returns number of days or undefined
 */
export const parseServiceFrequency = (frequency: string | undefined): number | undefined => {
  if (!frequency) return undefined;
  
  const trimmed = frequency.trim().toLowerCase();
  
  // Check for monthly format (e.g., "6-monthly", "12-monthly")
  if (trimmed.includes('monthly')) {
    const months = parseInt(trimmed);
    if (!isNaN(months)) {
      return months * 30; // Approximate days
    }
  }
  
  // Check for yearly format
  if (trimmed.includes('yearly') || trimmed.includes('annual')) {
    const years = parseInt(trimmed) || 1;
    return years * 365;
  }
  
  // Try to parse as direct number of days
  const days = parseInt(trimmed);
  if (!isNaN(days)) {
    return days;
  }
  
  return undefined;
};

/**
 * Calculate next service due date based on last service and frequency
 */
export const calculateNextServiceDue = (
  lastServiceDate: string | undefined,
  serviceFrequencyDays: number | undefined
): string | undefined => {
  if (!lastServiceDate || !serviceFrequencyDays) {
    return undefined;
  }
  
  try {
    const lastDate = parseISO(lastServiceDate);
    const nextDate = addDays(lastDate, serviceFrequencyDays);
    return nextDate.toISOString();
  } catch (error) {
    console.error('Error calculating next service date:', error);
    return undefined;
  }
};

/**
 * Calculate days until/overdue for service
 */
export const calculateDaysUntilService = (nextServiceDue: string | undefined): number | null => {
  if (!nextServiceDue) return null;
  
  try {
    const dueDate = parseISO(nextServiceDue);
    const today = new Date();
    return differenceInDays(dueDate, today);
  } catch (error) {
    console.error('Error calculating days until service:', error);
    return null;
  }
};

/**
 * Determine service status based on next due date
 */
export const getServiceStatus = (nextServiceDue: string | undefined): ServiceStatus => {
  if (!nextServiceDue) return 'current';
  
  const daysUntil = calculateDaysUntilService(nextServiceDue);
  if (daysUntil === null) return 'current';
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 30) return 'due-soon';
  return 'current';
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (isoString: string): boolean => {
  try {
    return isBefore(parseISO(isoString), new Date());
  } catch (error) {
    return false;
  }
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (isoString: string): boolean => {
  try {
    return isAfter(parseISO(isoString), new Date());
  } catch (error) {
    return false;
  }
};

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate QR code format (alphanumeric, 4-50 characters)
 */
export const validateQRCode = (qrCode: string): boolean => {
  const qrRegex = /^[A-Za-z0-9-_]{4,50}$/;
  return qrRegex.test(qrCode);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: any): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Sanitize string input (remove dangerous characters)
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate asset status
 */
export const isValidAssetStatus = (status: string): status is AssetStatus => {
  return ['active', 'spare', 'out-of-service', 'retired'].includes(status);
};

// ============================================
// Image Processing Utilities
// ============================================

/**
 * Compress image for upload
 * @param uri - Image URI from picker
 * @param quality - Compression quality (0-1)
 * @returns Compressed image URI
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.7
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize to max width 1200px
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return manipResult.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Get image file size in bytes
 */
export const getImageFileSize = async (uri: string): Promise<number> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    return 0;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

/**
 * Convert bytes to human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// ============================================
// Asset Utilities
// ============================================

/**
 * Get status color for UI
 */
export const getStatusColor = (status: AssetStatus): string => {
  const colors: Record<AssetStatus, string> = {
    'in-use': '#4CAF50',      // Green
    'spare': '#2196F3',       // Blue
    'out-of-service': '#F44336', // Red
    'under-repair': '#FF9800', // Orange
    'missing': '#9C27B0',     // Purple
  };
  
  return colors[status] || '#9E9E9E';
};

/**
 * Get service status color for UI
 */
export const getServiceStatusColor = (status: ServiceStatus): string => {
  const colors: Record<ServiceStatus, string> = {
    current: '#4CAF50',     // Green
    'due-soon': '#FF9800',  // Amber/Orange
    overdue: '#F44336',     // Red
  };
  
  return colors[status] || '#9E9E9E';
};

/**
 * Get status display text
 */
export const getStatusDisplayText = (status: AssetStatus): string => {
  const texts: Record<AssetStatus, string> = {
    'in-use': 'In Use',
    'spare': 'Spare',
    'out-of-service': 'Out of Service',
    'under-repair': 'Under Repair',
    'missing': 'Missing',
  };
  
  return texts[status] || status;
};

/**
 * Get service status display text
 */
export const getServiceStatusDisplayText = (status: ServiceStatus): string => {
  const texts = {
    current: 'Current',
    'due-soon': 'Due Soon',
    overdue: 'Overdue',
  };
  
  return texts[status] || status;
};

/**
 * Generate a unique ID (for offline operations)
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number | undefined, currency: string = 'AUD'): string => {
  if (amount === undefined || amount === null) return 'N/A';
  
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number | undefined => {
  if (!value) return undefined;
  
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? undefined : num;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Debounce function for search/input handlers
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Deep clone object (simple implementation)
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmptyObject = (obj: any): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Safely access nested object properties
 */
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'An unknown error occurred';
};

/**
 * Check if error is network-related
 */
export const isNetworkError = (error: any): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('network') || 
         message.includes('offline') || 
         message.includes('connection');
};

// ============================================
// Array Utilities
// ============================================

/**
 * Group array items by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by date field (descending)
 */
export const sortByDateDesc = <T extends Record<string, any>>(
  array: T[],
  dateField: keyof T
): T[] => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]).getTime();
    const dateB = new Date(b[dateField]).getTime();
    return dateB - dateA;
  });
};
