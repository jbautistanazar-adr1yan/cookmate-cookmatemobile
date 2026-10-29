import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0uz8yJU_RGSW0POSVVflkIXHcykqlSHo",
  authDomain: "cookmatemc.firebaseapp.com",
  projectId: "cookmatemc",
  storageBucket: "cookmatemc.firebasestorage.app",
  messagingSenderId: "936011169167",
  appId: "1:936011169167:web:3cfc4d3dd33faebe7e5ffa",
  measurementId: "G-RZEQTGX7FY"
};

// Prevent duplicate initialization on hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Export Firestore database
export const db = getFirestore(app);

// Export Firebase Storage instance
export const storage = getStorage(app);