/**
 * App Navigator - React Navigation Setup
 * Handles authentication flow and main app navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../hooks';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';

// Main Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ScannerScreen from '../screens/Scanner/ScannerScreen';
import AssetDetailsScreen from '../screens/Assets/AssetDetailsScreen';
import AssetListScreen from '../screens/Assets/AssetListScreen';
import EditAssetScreen from '../screens/Assets/EditAssetScreen';
import ImportScreen from '../screens/Import/ImportScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// Auth Navigator
function AuthNavigator() {
  const theme = useTheme();
  
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
    </AuthStack.Navigator>
  );
}

// Main Navigator
function MainNavigator() {
  const theme = useTheme();
  
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MainStack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Asset Tracker' }}
      />
      <MainStack.Screen 
        name="AssetList" 
        component={AssetListScreen}
        options={{ title: 'All Assets' }}
      />
      <MainStack.Screen 
        name="Scanner" 
        component={ScannerScreen}
        options={{ title: 'Scan QR Code' }}
      />
      <MainStack.Screen 
        name="AssetDetails" 
        component={AssetDetailsScreen}
        options={{ title: 'Asset Details' }}
      />
      <MainStack.Screen 
        name="EditAsset" 
        component={EditAssetScreen}
        options={({ route }) => ({
          title: route.params?.assetId ? 'Edit Asset' : 'Add Asset',
        })}
      />
      <MainStack.Screen 
        name="Import" 
        component={ImportScreen}
        options={{ title: 'Import Assets' }}
      />
      <MainStack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Live Dashboard' }}
      />
    </MainStack.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // Or a loading screen
  }
  
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
