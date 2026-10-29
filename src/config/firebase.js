import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0uz8yJU_RGSW0POSVVflkIXHcykqlSHo",
  authDomain: "cookmatemc.firebaseapp.com",
  projectId: "cookmatemc",
  storageBucket: "cookmatemc.firebasestorage.app",
  messagingSenderId: "936011169167",
  appId: "1:936011169167:web:3cfc4d3dd33faebe7e5ffa",
  measurementId: "G-RZEQTGX7FY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper function to check if a user document has role: 'admin'
export const checkAdminRole = async (user) => {
  if (!user) return false;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data().role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};