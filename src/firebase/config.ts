import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { 
  initializeAuth,
  getAuth,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Firebase configuration from app.json extra fields (works with Expo Go)
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || "AIzaSyCohFndCabChlli9zVQHVlCRd5igPsKq3Y",
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || "assests-tracker.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || "assests-tracker",
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || "assests-tracker.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || "429999185516",
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || "1:429999185516:web:5d926c5d40042674a94249",
  measurementId: Constants.expoConfig?.extra?.FIREBASE_MEASUREMENT_ID || "G-8HCCYJD1NB",
};

// Debug: Log configuration source
console.log('🔧 Firebase config source:', Constants.expoConfig?.extra ? 'app.json extra fields' : 'fallback values');

// Validate configuration
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missing = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase configuration keys:', missing);
    throw new Error(
      `Firebase configuration incomplete. Missing: ${missing.join(', ')}. ` +
      'Please check your .env file and app.json extra fields.'
    );
  }
};

// Initialize Firebase App
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const initializeFirebaseApp = (): FirebaseApp => {
  try {
    // Return existing app if already initialized
    if (app) {
      return app;
    }
    
    validateConfig();
    
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('✅ Firebase App already initialized');
      return app;
    }
    
    // Initialize new app
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase App initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

// Initialize Firebase Auth with persistence
const initializeFirebaseAuth = (firebaseApp: FirebaseApp): Auth => {
  try {
    // Check if Auth is already initialized
    if (auth) {
      console.log('✅ Firebase Auth already initialized');
      return auth;
    }
    
    // Just use getAuth - Firebase 12 handles persistence automatically
    auth = getAuth(firebaseApp);
    console.log(`✅ Firebase Auth initialized (${Platform.OS})`);
    
    if (!auth) {
      throw new Error('Failed to initialize Firebase Auth');
    }
    
    return auth;
  } catch (error: any) {
    console.error('❌ Firebase Auth initialization error:', error.message);
    throw error;
  }
};

// Initialize Firestore with offline persistence
const initializeFirestoreDB = (firebaseApp: FirebaseApp): Firestore => {
  try {
    // Check if Firestore is already initialized
    if (db) {
      console.log('✅ Firestore already initialized');
      return db;
    }
    
    // Initialize with custom settings for better offline support
    const firestoreSettings: any = {
      experimentalForceLongPolling: Platform.OS === 'android',
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    };

    try {
      db = initializeFirestore(firebaseApp, firestoreSettings);
      console.log('✅ Firestore initialized with offline persistence');
    } catch (error: any) {
      // If already initialized, get the existing instance
      if (error.code === 'failed-precondition') {
        db = getFirestore(firebaseApp);
        console.log('✅ Firestore instance retrieved (already initialized)');
      } else {
        throw error;
      }
    }
    
    return db;
  } catch (error) {
    console.error('❌ Firestore initialization error:', error);
    // Fallback to basic getFirestore
    if (!db) {
      db = getFirestore(firebaseApp);
      console.log('✅ Firestore initialized (Fallback)');
    }
    return db;
  }
};

// Initialize Firebase Storage (Optional - only if enabled in Firebase project)
const initializeFirebaseStorage = (firebaseApp: FirebaseApp): FirebaseStorage | null => {
  try {
    if (storage) {
      console.log('✅ Firebase Storage already initialized');
      return storage;
    }
    
    // Try to initialize storage, but don't fail if not available
    try {
      storage = getStorage(firebaseApp);
      console.log('✅ Firebase Storage initialized');
      return storage;
    } catch (storageError: any) {
      console.warn('⚠️ Firebase Storage not available (this is OK if not using paid plan)');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Firebase Storage initialization skipped:', error);
    return null;
  }
};

// Main initialization function
export const initializeFirebase = () => {
  try {
    console.log('🚀 Starting Firebase initialization...');
    const firebaseApp = initializeFirebaseApp();
    
    const firebaseAuth = initializeFirebaseAuth(firebaseApp);
    const firestore = initializeFirestoreDB(firebaseApp);
    const firebaseStorage = initializeFirebaseStorage(firebaseApp);
    
    console.log('✅ All Firebase services initialized');
    
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firestore,
      storage: firebaseStorage,
    };
  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
};

// Export initialized instances with safe getters
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = initializeFirebaseApp();
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = initializeFirebaseAuth(firebaseApp);
  }
  return auth;
};

export const getFirebaseDB = (): Firestore => {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = initializeFirestoreDB(firebaseApp);
  }
  return db;
};

export const getFirebaseStorage = (): FirebaseStorage | null => {
  if (!storage) {
    const firebaseApp = getFirebaseApp();
    storage = initializeFirebaseStorage(firebaseApp);
  }
  return storage;
};

// Collection references
export const COLLECTIONS = {
  ASSETS: 'assets',
  USERS: 'users',
  SERVICE_RECORDS: 'serviceRecords',
  IMPORT_JOBS: 'importJobs',
  DASHBOARD: 'dashboard',
  OFFLINE_QUEUE: 'offlineQueue',
} as const;

// Subcollections
export const SUBCOLLECTIONS = {
  HISTORY: 'history',
  IMAGES: 'images',
} as const;

export default {
  initializeFirebase,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDB,
  getFirebaseStorage,
  COLLECTIONS,
  SUBCOLLECTIONS,
};
