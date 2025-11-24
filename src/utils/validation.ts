/**
 * Validation Schemas using Yup
 * Form validation rules for asset and service record forms
 */

import * as yup from 'yup';

// ============================================
// Asset Form Validation Schema
// ============================================

export const assetValidationSchema = yup.object().shape({
  qrCode: yup
    .string()
    .required('QR Code is required')
    .matches(/^[A-Za-z0-9-_]{4,50}$/, 'QR Code must be 4-50 alphanumeric characters')
    .label('QR Code'),
  
  name: yup
    .string()
    .required('Asset name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .label('Asset Name'),
  
  category: yup
    .string()
    .required('Category is required')
    .label('Category'),
  
  manufacturer: yup
    .string()
    .max(100, 'Manufacturer must not exceed 100 characters')
    .label('Manufacturer'),
  
  model: yup
    .string()
    .max(100, 'Model must not exceed 100 characters')
    .label('Model'),
  
  serialNumber: yup
    .string()
    .max(100, 'Serial number must not exceed 100 characters')
    .label('Serial Number'),
  
  purchaseDate: yup
    .string()
    .nullable()
    .label('Purchase Date'),
  
  purchaseCost: yup
    .string()
    .nullable()
    .test('is-valid-currency', 'Invalid currency amount', (value) => {
      if (!value) return true;
      const num = parseFloat(value.replace(/[^0-9.]/g, ''));
      return !isNaN(num) && num >= 0;
    })
    .label('Purchase Cost'),
  
  status: yup
    .string()
    .oneOf(['active', 'spare', 'out-of-service', 'retired'], 'Invalid status')
    .required('Status is required')
    .label('Status'),
  
  outOfServiceReason: yup
    .string()
    .when('status', {
      is: 'out-of-service',
      then: (schema) => schema.required('Reason is required when asset is out of service'),
      otherwise: (schema) => schema.nullable(),
    })
    .max(500, 'Reason must not exceed 500 characters')
    .label('Out of Service Reason'),
  
  // Location fields
  locationType: yup
    .string()
    .oneOf(['room', 'spare', 'maintenance', 'storage'], 'Invalid location type')
    .required('Location type is required')
    .label('Location Type'),
  
  roomNumber: yup
    .string()
    .when('locationType', {
      is: 'room',
      then: (schema) => schema.required('Room number is required for room location'),
      otherwise: (schema) => schema.nullable(),
    })
    .max(50, 'Room number must not exceed 50 characters')
    .label('Room Number'),
  
  building: yup
    .string()
    .max(50, 'Building must not exceed 50 characters')
    .label('Building'),
  
  floor: yup
    .string()
    .max(50, 'Floor must not exceed 50 characters')
    .label('Floor'),
  
  locationNotes: yup
    .string()
    .max(500, 'Location notes must not exceed 500 characters')
    .label('Location Notes'),
  
  // Maintenance fields
  serviceFrequency: yup
    .string()
    .nullable()
    .test('is-positive-number', 'Service frequency must be a positive number', (value) => {
      if (!value) return true;
      const num = parseInt(value);
      return !isNaN(num) && num > 0;
    })
    .label('Service Frequency'),
  
  lastServiceDate: yup
    .string()
    .nullable()
    .label('Last Service Date'),
  
  calibrationRequired: yup
    .boolean()
    .required()
    .label('Calibration Required'),
  
  safeWorkingLoad: yup
    .string()
    .nullable()
    .test('is-positive-number', 'Safe working load must be a positive number', (value) => {
      if (!value) return true;
      const num = parseFloat(value);
      return !isNaN(num) && num > 0;
    })
    .label('Safe Working Load'),
});

// ============================================
// Service Record Form Validation Schema
// ============================================

export const serviceRecordValidationSchema = yup.object().shape({
  serviceDate: yup
    .string()
    .required('Service date is required')
    .test('is-valid-date', 'Service date cannot be in the future', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return date <= new Date();
    })
    .label('Service Date'),
  
  serviceType: yup
    .string()
    .oneOf(['routine', 'repair', 'calibration', 'inspection', 'cleaning'], 'Invalid service type')
    .required('Service type is required')
    .label('Service Type'),
  
  performedBy: yup
    .string()
    .required('Performed by is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .label('Performed By'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .label('Description'),
  
  cost: yup
    .string()
    .nullable()
    .test('is-valid-currency', 'Invalid cost amount', (value) => {
      if (!value) return true;
      const num = parseFloat(value.replace(/[^0-9.]/g, ''));
      return !isNaN(num) && num >= 0;
    })
    .label('Cost'),
});

// ============================================
// Login Form Validation Schema
// ============================================

export const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .label('Email'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .label('Password'),
});

// ============================================
// Registration Form Validation Schema
// ============================================

export const registerValidationSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email format')
    .label('Email'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    )
    .label('Password'),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match')
    .label('Confirm Password'),
  
  displayName: yup
    .string()
    .required('Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must not exceed 100 characters')
    .label('Display Name'),
});

// ============================================
// CSV Import Row Validation
// ============================================

export const importRowValidationSchema = yup.object().shape({
  qrCode: yup
    .string()
    .required('QR Code is required')
    .matches(/^[A-Za-z0-9-_]{4,50}$/, 'Invalid QR Code format'),
  
  name: yup
    .string()
    .required('Asset name is required')
    .min(2, 'Name too short')
    .max(100, 'Name too long'),
  
  category: yup
    .string()
    .required('Category is required'),
  
  manufacturer: yup
    .string()
    .max(100, 'Manufacturer too long'),
  
  model: yup
    .string()
    .max(100, 'Model too long'),
  
  serialNumber: yup
    .string()
    .max(100, 'Serial number too long'),
  
  purchaseDate: yup
    .string()
    .nullable()
    .test('is-valid-date', 'Invalid date format', (value) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  
  purchaseCost: yup
    .mixed()
    .nullable()
    .test('is-valid-number', 'Invalid cost', (value) => {
      if (!value) return true;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return typeof num === 'number' && !isNaN(num) && num >= 0;
    }),
  
  status: yup
    .string()
    .oneOf(['active', 'spare', 'out-of-service', 'retired', ''], 'Invalid status')
    .nullable(),
  
  roomNumber: yup
    .string()
    .max(50, 'Room number too long')
    .nullable(),
  
  building: yup
    .string()
    .max(50, 'Building too long')
    .nullable(),
  
  floor: yup
    .string()
    .max(50, 'Floor too long')
    .nullable(),
  
  serviceFrequency: yup
    .mixed()
    .nullable()
    .test('is-positive-number', 'Invalid service frequency', (value) => {
      if (!value) return true;
      const num = typeof value === 'string' ? parseInt(value) : value;
      return typeof num === 'number' && !isNaN(num) && num > 0;
    }),
  
  calibrationRequired: yup
    .mixed()
    .nullable()
    .test('is-boolean', 'Invalid calibration value', (value) => {
      if (value === null || value === undefined || value === '') return true;
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return ['true', 'false', 'yes', 'no', '1', '0'].includes(lower);
      }
      return false;
    }),
  
  safeWorkingLoad: yup
    .mixed()
    .nullable()
    .test('is-positive-number', 'Invalid safe working load', (value) => {
      if (!value) return true;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return typeof num === 'number' && !isNaN(num) && num > 0;
    }),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate a single field
 */
export const validateField = async (
  schema: yup.AnySchema,
  fieldName: string,
  value: any
): Promise<string | null> => {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value });
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return 'Validation error';
  }
};

/**
 * Validate entire form data
 */
export const validateFormData = async (
  schema: yup.AnySchema,
  data: any
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { _general: 'Validation error' } };
  }
};
