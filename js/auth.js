// auth.js - Firebase authentication functions for Ultra Spoofer

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase-config.js';

// Generate a random license key
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let licenseKey = '';
  
  // Generate 5 groups of 5 characters separated by hyphens (e.g., ABCDE-12345-FGHIJ-67890-KLMNO)
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      licenseKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 4) {
      licenseKey += '-';
    }
  }
  
  return licenseKey;
}

// Calculate expiration date based on license type
function calculateExpirationDate(licenseType) {
  const now = new Date();
  
  switch(licenseType) {
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'annual':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'lifetime':
      return null; // No expiration
    default:
      return new Date(now.setMonth(now.getMonth() + 1));
  }
}

// Register a new user
export async function registerUser(email, password, licenseType) {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate license key
    const licenseKey = generateLicenseKey();
    
    // Calculate expiration date
    const expirationDate = calculateExpirationDate(licenseType);
    
    // Create user document in Firestore
    const userData = {
      email: user.email,
      licenseKey,
      licenseType,
      purchaseDate: serverTimestamp(),
      expirationDate: expirationDate ? expirationDate : null,
      lastLogin: serverTimestamp(),
      uid: user.uid
    };
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), userData);
    
    // Send email verification
    await sendEmailVerification(user);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        licenseKey,
        licenseType,
        expirationDate: expirationDate ? expirationDate.toISOString() : null
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Log in a user
export async function loginUser(email, password) {
  try {
    // Sign in with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if license is expired
      if (userData.expirationDate && new Date() > userData.expirationDate.toDate()) {
        await signOut(auth);
        return {
          success: false,
          error: 'Your license has expired. Please renew your subscription.'
        };
      }
      
      // Update last login time
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          licenseKey: userData.licenseKey,
          licenseType: userData.licenseType,
          expirationDate: userData.expirationDate ? userData.expirationDate.toDate().toISOString() : null
        }
      };
    } else {
      // User document doesn't exist in Firestore
      await signOut(auth);
      return {
        success: false,
        error: 'User data not found. Please contact support.'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check license key
export async function checkLicenseKey(licenseKey) {
  try {
    // Query Firestore for the license key
    const snapshot = await db.collection('users')
      .where('licenseKey', '==', licenseKey)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return {
        success: false,
        error: 'Invalid license key.'
      };
    }
    
    const userData = snapshot.docs[0].data();
    
    // Check if license is expired
    if (userData.expirationDate && new Date() > userData.expirationDate.toDate()) {
      return {
        success: false,
        error: 'License has expired. Please renew your subscription.'
      };
    }
    
    return {
      success: true,
      licenseType: userData.licenseType,
      expirationDate: userData.expirationDate ? userData.expirationDate.toDate().toISOString() : null
    };
  } catch (error) {
    console.error('License check error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Log out user
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Reset password
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get current authenticated user
export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      if (user) {
        // Get user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            resolve({
              uid: user.uid,
              email: user.email,
              licenseKey: userData.licenseKey,
              licenseType: userData.licenseType,
              expirationDate: userData.expirationDate ? userData.expirationDate.toDate().toISOString() : null
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          reject(error);
        }
      } else {
        resolve(null);
      }
    }, reject);
  });
}

// Check if user is authenticated
export function isAuthenticated() {
  return auth.currentUser !== null;
}