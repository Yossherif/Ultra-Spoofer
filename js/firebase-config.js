// firebase-config.js - Updated version
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6W4Z0p1rMIcqfvsW38pswlQhJqitEKY8",
  authDomain: "ultra-spoofer.firebaseapp.com",
  databaseURL: "https://ultra-spoofer-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ultra-spoofer",
  storageBucket: "ultra-spoofer.firebasestorage.app",
  messagingSenderId: "478637927150",
  appId: "1:478637927150:web:a2a79a89a995f0955a21ff",
  measurementId: "G-S16K60NN14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { app, auth, db, analytics };