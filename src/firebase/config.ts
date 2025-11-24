import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  initializeAuth,
  Persistence
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Custom React Native persistence implementation
const getReactNativePersistence = (storage: any): Persistence => ({
  type: 'LOCAL',
  // @ts-ignore
  _get: async (key: string) => {
    const value = await storage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  // @ts-ignore
  _set: async (key: string, value: any) => {
    await storage.setItem(key, JSON.stringify(value));
  },
  // @ts-ignore
  _remove: async (key: string) => {
    await storage.removeItem(key);
  }
});

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: Constants.expoConfig?.extra?.FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
};

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
const initializeFirebaseAuth = async (firebaseApp: FirebaseApp): Promise<Auth> => {
  try {
    // Check if Auth is already initialized
    if (auth) {
      console.log('✅ Firebase Auth already initialized');
      return auth;
    }
    
    // Ensure app is fully initialized by checking it's registered
    const apps = getApps();
    if (apps.length === 0) {
      throw new Error('Firebase App not initialized');
    }
    
    // For React Native, use initializeAuth with AsyncStorage persistence
    if (Platform.OS !== 'web') {
      try {
        auth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log('✅ Firebase Auth initialized with AsyncStorage persistence (Native)');
      } catch (error: any) {
        // If already initialized, get existing instance
        if (error.code === 'auth/already-initialized') {
          auth = getAuth(firebaseApp);
          console.log('✅ Firebase Auth retrieved (already initialized - Native)');
        } else {
          throw error;
        }
      }
    } else {
      // For web, use getAuth
      auth = getAuth(firebaseApp);
      console.log('✅ Firebase Auth initialized (Web)');
    }
    
    if (!auth) {
      throw new Error('Failed to initialize Firebase Auth');
    }
    
    return auth;
  } catch (error: any) {
    console.error('❌ Firebase Auth initialization error:', error);
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
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: Platform.OS === 'android',
    };

    // Add persistent cache for web (new API)
    if (Platform.OS === 'web') {
      firestoreSettings.localCache = persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      });
    }

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

// Initialize Firebase Storage
const initializeFirebaseStorage = (firebaseApp: FirebaseApp): FirebaseStorage => {
  try {
    if (storage) {
      console.log('✅ Firebase Storage already initialized');
      return storage;
    }
    
    storage = getStorage(firebaseApp);
    console.log('✅ Firebase Storage initialized');
    return storage;
  } catch (error) {
    console.error('❌ Firebase Storage initialization error:', error);
    throw error;
  }
};

// Main initialization function
export const initializeFirebase = async () => {
  try {
    const firebaseApp = initializeFirebaseApp();
    
    const firebaseAuth = await initializeFirebaseAuth(firebaseApp);
    const firestore = initializeFirestoreDB(firebaseApp);
    const firebaseStorage = initializeFirebaseStorage(firebaseApp);
    
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firestore,
      storage: firebaseStorage,
    };
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
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

export const getFirebaseAuth = async (): Promise<Auth> => {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = await initializeFirebaseAuth(firebaseApp);
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

export const getFirebaseStorage = (): FirebaseStorage => {
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
