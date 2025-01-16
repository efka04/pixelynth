// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'; // Ensure Firestore is imported
import { getStorage } from 'firebase/storage'; // Keep only one import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY, // Updated to use NEXT_PUBLIC_API_KEY
  authDomain: "pixelynth-c41ea.firebaseapp.com",
  projectId: "pixelynth-c41ea",
  storageBucket: "pixelynth-c41ea.firebasestorage.app",
  messagingSenderId: "706633323779",
  appId: "1:706633323779:web:f21901e917d97c2422c536",
  measurementId: "G-E5T0G2RLTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Removed as per previous suggestions
const db = getFirestore(app); // Ensure Firestore is initialized
const storage = getStorage(app);

export { app, db, storage };

