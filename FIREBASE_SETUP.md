# Subflix! Firebase Production Setup Guide

This guide explains how to transition Subflix from local IndexedDB testing to a production-ready Firebase deployment. Firebase provides free hosting, database (Firestore), storage, and authentication services perfect for this use case.

## Prerequisites

Before starting, ensure you have the following:

- A Google account (for Firebase Console access)
- Node.js and npm installed on your development machine
- The Firebase CLI installed (`npm install -g firebase-tools`)
- A Telegram Bot created via BotFather (for Mini App integration)
- Your Telegram user ID (for admin configuration)

## Step 1: Create a Firebase Project

### 1.1 Access Firebase Console

Navigate to [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.

### 1.2 Create a New Project

Click **"Add project"** and follow these steps:

- **Project Name:** Enter "Subflix" (or your preferred name)
- **Analytics:** Disable Google Analytics (optional, not required for this app)
- Click **"Create project"** and wait for initialization to complete

### 1.3 Enable Required Services

Once your project is created, enable the following services from the Firebase Console:

**Firestore Database:**
- Navigate to **Build > Firestore Database**
- Click **"Create database"**
- Choose **"Start in production mode"** (you'll configure security rules next)
- Select your preferred region (closest to your users)
- Click **"Create"**

**Cloud Storage:**
- Navigate to **Build > Storage**
- Click **"Get started"**
- Accept the default security rules and confirm
- Select your preferred region

**Authentication:**
- Navigate to **Build > Authentication**
- Click **"Get started"**
- Enable **"Anonymous"** authentication (Sign-in method tab)

**Hosting:**
- Navigate to **Build > Hosting**
- Click **"Get started"** and follow the prompts

## Step 2: Configure Firestore Security Rules

Security rules protect your database from unauthorized access. Replace the default rules with the following configuration:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read approved subtitles
    match /approved_subtitles/{document=**} {
      allow read: if true;
    }

    // Allow users to read their own pending subtitles
    match /pending_subtitles/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null;
      allow update, delete: if false; // Only admins can modify
    }

    // Admin-only access for admin operations
    match /admin_config/{document=**} {
      allow read, write: if request.auth.uid in get(/databases/$(database)/documents/admin_config/admins).data.ids;
    }

    // Store admin IDs
    match /admin_config/admins {
      allow read: if true;
      allow write: if false; // Set manually in Firebase Console
    }
  }
}
```

To apply these rules:

1. Navigate to **Firestore Database > Rules** tab
2. Replace the default rules with the configuration above
3. Click **"Publish"**

## Step 3: Initialize Firebase in Your Project

### 3.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 3.2 Login to Firebase

```bash
firebase login
```

This opens a browser window for authentication. Complete the login process.

### 3.3 Initialize Firebase in Your Project Directory

Navigate to your project root and run:

```bash
firebase init
```

When prompted, select the following options:

- **Features:** Select "Firestore", "Storage", "Hosting", and "Emulators" (for local testing)
- **Project:** Select your "Subflix" project
- **Firestore location:** Choose your preferred region
- **Public directory:** Enter `dist/public` (Vite's build output)
- **Single-page app:** Answer "Yes"

### 3.4 Create Firebase Configuration File

Create a new file `firebase-config.json` in your project root:

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT_ID.appspot.com",
  "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
```

To find these values:

1. Go to Firebase Console > Project Settings (gear icon)
2. Under "Your apps", click the web app you created
3. Copy the configuration object and fill in the JSON file above

## Step 4: Update React App for Firebase

### 4.1 Install Firebase SDK

```bash
npm install firebase
```

### 4.2 Create Firebase Service Module

Create a new file `client/src/lib/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Initialize anonymous authentication
signInAnonymously(auth).catch((error) => {
  console.error("Authentication error:", error);
});

export const firebaseService = {
  async getApprovedSubtitles() {
    const q = query(collection(db, "approved_subtitles"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async getPendingSubtitles() {
    const q = query(collection(db, "pending_subtitles"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async getUserSubtitles(userId: string) {
    const q = query(
      collection(db, "pending_subtitles"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async uploadSubtitle(subtitle: any, srtFile: File) {
    // Upload SRT file to storage
    const storageRef = ref(storage, `subtitles/${subtitle.id}.srt`);
    await uploadBytes(storageRef, srtFile);
    const downloadURL = await getDownloadURL(storageRef);

    // Add subtitle to pending collection
    const docRef = await addDoc(collection(db, "pending_subtitles"), {
      ...subtitle,
      fileUrl: downloadURL,
      status: "pending",
      uploadedAt: new Date(),
    });

    return docRef.id;
  },

  async approveSubtitle(subtitleId: string) {
    const docRef = doc(db, "pending_subtitles", subtitleId);
    const pendingDoc = await getDocs(query(collection(db, "pending_subtitles")));
    
    const subtitle = pendingDoc.docs.find((d) => d.id === subtitleId)?.data();
    if (subtitle) {
      await addDoc(collection(db, "approved_subtitles"), {
        ...subtitle,
        status: "approved",
      });
      await deleteDoc(docRef);
    }
  },

  async rejectSubtitle(subtitleId: string) {
    const docRef = doc(db, "pending_subtitles", subtitleId);
    await deleteDoc(docRef);
  },
};
```

### 4.3 Create Environment Variables File

Create `.env.local` in your project root:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

Replace the values with your Firebase configuration.

## Step 5: Set Admin IDs in Firestore

### 5.1 Create Admin Configuration Document

1. Go to Firebase Console > Firestore Database
2. Click **"Start collection"**
3. Collection ID: `admin_config`
4. Document ID: `admins`
5. Add a field:
   - **Field name:** `ids`
   - **Type:** Array
   - **Value:** Add your Telegram user ID (e.g., `[12345]`)

## Step 6: Deploy to Firebase Hosting

### 6.1 Build Your React App

```bash
npm run build
```

### 6.2 Deploy to Firebase

```bash
firebase deploy
```

Firebase will deploy your app to a URL like `https://subflix-xxxxx.web.app`

### 6.3 Configure Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click **"Add custom domain"**
3. Follow the domain verification process
4. Update your DNS records as instructed

## Step 7: Integrate with Telegram Mini App

### 7.1 Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Save your **Bot Token** (you'll need this)

### 7.2 Set Mini App URL

Send this command to BotFather (replace tokens and URLs):

```
/setmenubutton
```

Select your bot, then choose "Web App" and enter your Firebase hosting URL.

### 7.3 Add Telegram Web App Script

Add this to your `client/index.html` in the `<head>` section:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 7.4 Initialize Telegram Web App in React

Update `client/src/pages/Home.tsx` to use Telegram data:

```typescript
useEffect(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    
    const user = tg.initDataUnsafe?.user;
    if (user) {
      setUserInfo({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
      });
    }
  }
}, []);
```

## Step 8: Test Your Deployment

### 8.1 Local Testing with Emulator

```bash
firebase emulators:start
```

This starts local Firestore and Storage emulators for testing.

### 8.2 Test in Telegram

1. Open your bot in Telegram
2. Click the web app button
3. Test all features:
   - Search and browse subtitles
   - Upload a subtitle
   - Approve/reject (if admin)
   - View creator dashboard

## Step 9: Monitoring and Maintenance

### Monitor Usage

- **Firestore:** Firebase Console > Firestore Database > Usage tab
- **Storage:** Firebase Console > Storage > Files tab
- **Hosting:** Firebase Console > Hosting > Analytics tab

### Backup Data

Firebase provides automatic backups, but you can also export data:

1. Go to Firestore Database
2. Click the three-dot menu
3. Select "Export collections"

### Scale Considerations

The Firebase free tier includes:

- **Firestore:** 1 GB storage, 50,000 reads/day, 20,000 writes/day
- **Storage:** 5 GB storage
- **Hosting:** 10 GB/month bandwidth

For production with high traffic, upgrade to a paid plan.

## Troubleshooting

**Issue: "Permission denied" errors**
- Check your Firestore security rules
- Ensure anonymous authentication is enabled
- Verify your admin IDs are correctly set

**Issue: Files not uploading**
- Check Storage security rules
- Ensure file size is under 100 MB
- Verify storage bucket is initialized

**Issue: Telegram Mini App not loading**
- Verify the Firebase hosting URL is correct
- Check browser console for errors
- Ensure Telegram Web App script is loaded

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
