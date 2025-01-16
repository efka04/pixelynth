// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'; // Ensure Firestore is imported
import { getStorage } from 'firebase/storage'; // Keep only one import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY, // Updated to use NEXT_PUBLIC_API_KEY
  apiKey: process.env.NEXT_PUBLIC_API_KEY, 
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN, 
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID, 
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET, 
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID, 
  appId: process.env.NEXT_PUBLIC_APP_ID, 
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Removed as per previous suggestions
const db = getFirestore(app); // Ensure Firestore is initialized
const storage = getStorage(app);

export { app, db, storage };

