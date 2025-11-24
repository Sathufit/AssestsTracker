/**
 * Custom Hooks - Authentication and Assets Management
 * Provides hooks for Firebase auth and real-time asset data with offline support
 */

import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseAuth } from '../firebase/config';
import { Asset, User, OfflineQueueItem } from '../types';
import {
  getAssets,
  subscribeToAssets,
  getAssetByQRCode,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../api/assets';
import { getCurrentISOString, generateUniqueId } from '../utils/helpers';

// ============================================
// useAuth Hook
// ============================================

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initAuth = async () => {
      try {
        const firebaseAuth = await getFirebaseAuth();
        setAuth(firebaseAuth);
        
        unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          setAuthState({
            user,
            loading: false,
            error: null,
          });
        });
      } catch (error: any) {
        console.error('❌ Auth initialization error:', error);
        setAuthState({
          user: null,
          loading: false,
          error: error.message || 'Failed to initialize authentication',
        });
      }
    };
    
    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error('Authentication not initialized');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed in successfully');
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      const errorMessage = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : error.message || 'Failed to sign in';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      if (!auth) throw new Error('Authentication not initialized');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      console.log('✅ User registered successfully');
      return userCredential.user;
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : error.message || 'Failed to register';
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      if (!auth) throw new Error('Authentication not initialized');
      await firebaseSignOut(auth);
      console.log('✅ User signed out');
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
  };
};

// ============================================
// useAssets Hook with Offline Support
// ============================================

interface AssetsState {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
}

const OFFLINE_QUEUE_KEY = '@assettracker_offline_queue';
const CACHED_ASSETS_KEY = '@assettracker_cached_assets';

export const useAssets = (filters?: { status?: string; category?: string }) => {
  const [state, setState] = useState<AssetsState>({
    assets: [],
    loading: true,
    error: null,
    syncing: false,
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // Load cached assets from AsyncStorage
  const loadCachedAssets = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHED_ASSETS_KEY);
      if (cached) {
        const assets = JSON.parse(cached);
        setState(prev => ({ ...prev, assets, loading: false }));
      }
    } catch (error) {
      console.error('Error loading cached assets:', error);
    }
  }, []);

  // Save assets to cache
  const cacheAssets = useCallback(async (assets: Asset[]) => {
    try {
      await AsyncStorage.setItem(CACHED_ASSETS_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error('Error caching assets:', error);
    }
  }, []);

  // Load offline queue
  const loadOfflineQueue = useCallback(async () => {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queue) {
        setOfflineQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }, []);

  // Save offline queue
  const saveOfflineQueue = useCallback(async (queue: OfflineQueueItem[]) => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setOfflineQueue(queue);
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }, []);

  // Add operation to offline queue
  const addToOfflineQueue = useCallback(async (
    type: OfflineQueueItem['type'],
    collection: string,
    documentId: string,
    data: any
  ) => {
    const item: OfflineQueueItem = {
      id: generateUniqueId(),
      type,
      collection,
      documentId,
      data,
      timestamp: getCurrentISOString(),
      retryCount: 0,
    };

    const newQueue = [...offlineQueue, item];
    await saveOfflineQueue(newQueue);
  }, [offlineQueue, saveOfflineQueue]);

  // Process offline queue when back online
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    setState(prev => ({ ...prev, syncing: true }));

    const remainingQueue: OfflineQueueItem[] = [];

    for (const item of offlineQueue) {
      try {
        // Process based on type
        // Note: This is a simplified version - in production you'd implement full sync logic
        console.log('Processing offline item:', item);
        
        // If successful, don't add back to queue
      } catch (error) {
        console.error('Error processing offline item:', error);
        // Keep in queue for retry
        remainingQueue.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    }

    await saveOfflineQueue(remainingQueue);
    setState(prev => ({ ...prev, syncing: false }));
  }, [offlineQueue, saveOfflineQueue]);

  // Subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        // Load cached data first
        await loadCachedAssets();
        await loadOfflineQueue();

        // Subscribe to real-time updates
        unsubscribe = subscribeToAssets((assets) => {
          setState(prev => ({ ...prev, assets, loading: false, error: null }));
          cacheAssets(assets);
        }, filters);

        // Process any pending offline operations
        await processOfflineQueue();
      } catch (error: any) {
        console.error('Error setting up assets subscription:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to load assets',
          loading: false,
        }));
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [filters?.status, filters?.category]);

  // Refresh assets manually
  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const assets = await getAssets(filters);
      setState(prev => ({ ...prev, assets, loading: false }));
      await cacheAssets(assets);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh assets',
        loading: false,
      }));
    }
  }, [filters, cacheAssets]);

  // Search by QR code
  const searchByQRCode = useCallback(async (qrCode: string): Promise<Asset | null> => {
    try {
      return await getAssetByQRCode(qrCode);
    } catch (error: any) {
      console.error('Error searching by QR code:', error);
      throw error;
    }
  }, []);

  // Get single asset
  const getAsset = useCallback(async (assetId: string): Promise<Asset | null> => {
    try {
      return await getAssetById(assetId);
    } catch (error: any) {
      console.error('Error getting asset:', error);
      throw error;
    }
  }, []);

  return {
    assets: state.assets,
    loading: state.loading,
    error: state.error,
    syncing: state.syncing,
    offlineQueueCount: offlineQueue.length,
    refresh,
    searchByQRCode,
    getAsset,
    addToOfflineQueue,
    processOfflineQueue,
  };
};

// ============================================
// useNetworkStatus Hook
// ============================================

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // This is a simplified version
    // In production, use @react-native-community/netinfo
    const checkConnection = () => {
      // Check if we can reach Firebase
      fetch('https://www.google.com', { mode: 'no-cors' })
        .then(() => setIsOnline(true))
        .catch(() => setIsOnline(false));
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return isOnline;
};
