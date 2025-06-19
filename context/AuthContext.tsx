// context/AuthContext.tsx
"use client"; // <-- Add this line at the very top

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app'; // Added getApps, getApp
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (PASTE YOUR ACTUAL CONFIG HERE)
const firebaseConfig = {
    apiKey: "AIzaSyA2z9E64N8_hbzX0K94nz9-C-t4IpRD_JI",
    authDomain: "mission-placement.firebaseapp.com",
    projectId: "mission-placement",
    storageBucket: "mission-placement.firebasestorage.app",
    messagingSenderId: "1097471949042",
    appId: "1:1097471949042:web:e3853a077fe1526e7f786b"
};

// Initialize Firebase (only once)
let app: FirebaseApp;
let auth: Auth;
let db: any; // Firestore instance

// Updated initialization logic for App Router to prevent re-initialization errors
if (getApps().length === 0) { // Check if no Firebase app has been initialized yet
    app = initializeApp(firebaseConfig);
} else {
    app = getApp(); // If already initialized, get the existing app
}

auth = getAuth(app);
db = getFirestore(app);


// Define AuthContext type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export db and auth for direct Firestore access in components
export { db, auth };