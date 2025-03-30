// firebase-config.js - Firebase configuration file

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6W4Z0p1rMIcqfvsW38pswlQhJqitEKY8",
  authDomain: "ultra-spoofer.firebaseapp.com",
  projectId: "ultra-spoofer",
  storageBucket: "ultra-spoofer.firebasestorage.app",
  messagingSenderId: "478637927150",
  appId: "1:478637927150:web:a2a79a89a995f0955a21ff",
  measurementId: "G-S16K60NN14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { auth, db };