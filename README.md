# AssetTracker - Residential Aged Care Asset Management

A comprehensive mobile and web app for tracking clinical, mobility, and maintenance-related assets across Residential Aged Care (RAC) facilities and Independent Living Unit (ILU) apartments.

## Features

### Core Functionality
- **QR Code Scanning**: Instant asset lookup by scanning QR codes
- **Asset Management**: Full CRUD operations for all asset types
- **Quick Actions**: 
  - Assign to room (RAC or ILU)
  - Mark as spare and assign to storage
  - Tag out of service with reason
  - Track condition (Good, Fair, Poor)
- **Service/Calibration Tracking**: 
  - Service frequency management (6-monthly, 12-monthly)
  - Last service date and next due date
  - Calibration requirements for hoists and scales
  - Safe working load tracking
- **Live Dashboard**: Real-time status display optimized for office TV
- **Bulk Import**: Excel/CSV import for initial setup
- **Offline Support**: Works offline with automatic sync

### Asset Types Tracked
**Stage 1 (Primary Focus):**
- Beds & Bed Components (frames, motors, remotes)
- Air Mattresses & Pumps
- Bed Sensors & Chair Sensors
- Mobility Equipment (wheelchairs, walkers, transit chairs)
- Lifting Equipment (ceiling hoists, portable hoists, stand-up lifters)
- Weighing Equipment (chair scales, standing scales, hoist scales)

### Dashboard Display (Office TV)
Color-coded live status:
- 🟢 **Green** = All good, service current
- 🟠 **Amber** = Service due soon (within 30 days)
- 🔴 **Red** = Overdue service or out of service

Shows real-time counts:
- Total assets by category
- In Use / Spare / Out of Service breakdown
- Service status (Current, Due Soon, Overdue)
- Missing items alerts

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Firebase account and project

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password provider)
3. Enable **Firestore Database** (production mode)
4. Enable **Storage**

### 3. Configure Environment

Create `.env` file with your Firebase credentials:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Update `app.json` with the same credentials in the `extra` section.

### 4. Firestore Security Rules

In Firebase Console → Firestore Database → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /assets/{assetId} {
      allow read, write: if isAuthenticated();
      
      match /serviceRecords/{recordId} {
        allow read, write: if isAuthenticated();
      }
      
      match /assetHistory/{historyId} {
        allow read: if isAuthenticated();
        allow write: if false;
      }
    }
    
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

### 5. Storage Rules

In Firebase Console → Storage → Rules, add:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assets/{assetId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Running the App

```bash
npm start
```

Then:
- Press `w` for web
- Press `a` for Android (requires Android Studio)
- Press `i` for iOS (requires Xcode on macOS)
- Scan QR code with Expo Go app on your phone

## First Time Setup

1. Enable Firebase Authentication in Firebase Console
2. Run the app
3. Sign in with email and password (create user in Firebase Console → Authentication)
4. Start adding assets!

## Project Structure

```
src/
├── api/           # Firebase API layer
├── firebase/      # Firebase configuration
├── hooks/         # Custom React hooks
├── navigation/    # React Navigation setup
├── screens/       # App screens
│   ├── Assets/    # Asset details & edit
│   ├── Auth/      # Login
│   ├── Home/      # Dashboard
│   └── Scanner/   # QR scanner
├── theme/         # UI theme
├── types/         # TypeScript types
└── utils/         # Helper functions
```

## Technologies

- **React Native** with Expo
- **TypeScript** for type safety
- **Firebase** (Auth, Firestore, Storage)
- **React Navigation** for routing
- **React Native Paper** for UI
- **Formik + Yup** for forms
- **expo-barcode-scanner** for QR codes

## Support

For issues or questions, check the Firebase Console for errors and ensure all services are enabled.
