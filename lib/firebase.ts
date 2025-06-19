// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration (copy from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyA2z9E64N8_hbzX0K94nz9-C-t4IpRD_JI",
    authDomain: "mission-placement.firebaseapp.com",
    projectId: "mission-placement",
    storageBucket: "mission-placement.firebasestorage.app",
    messagingSenderId: "1097471949042",
    appId: "1:1097471949042:web:e3853a077fe1526e7f786b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };