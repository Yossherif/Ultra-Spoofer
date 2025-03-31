// Ultra Spoofer Authentication Utilities with Firebase
import { auth, db } from './firebase-config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';

const AuthUtils = {
  // Initialize the auth system
  init() {
    // Set up authentication state listener
    onAuthStateChanged(auth, (user) => {
      // You can handle auth state changes here if needed
      console.log("Auth state changed:", user ? "logged in" : "logged out");
    });
  },

  // Register a new user
  async register(email, password) {
    try {
      // Basic validation
      if (!this.validateEmail(email)) {
        return { success: false, message: 'Please enter a valid email address.' };
      }
      
      if (!this.validatePassword(password)) {
        return { success: false, message: 'Password must be at least 8 characters long and include at least one number or symbol.' };
      }
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        createdAt: new Date().toISOString(),
        licenseKeys: [],
        isActive: true
      });
      
      return { 
        success: true, 
        message: 'Account created successfully!',
        user: {
          id: user.uid,
          email: user.email,
          licenseKeys: []
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle Firebase specific errors
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, message: 'An account with this email already exists.' };
      }
      
      return { success: false, message: error.message || 'Registration failed' };
    }
  },

  // Login with email and password
  async login(emailOrLicenseKey, password, rememberMe = false) {
    try {
      if (!emailOrLicenseKey || !password) {
        return { success: false, message: 'Please enter both email/license and password.' };
      }
      
      // Check if input is a license key
      if (this.isLicenseKeyFormat(emailOrLicenseKey)) {
        return await this.loginWithLicenseKey(emailOrLicenseKey, password);
      }
      
      // Regular email login
      const userCredential = await signInWithEmailAndPassword(auth, emailOrLicenseKey, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // User exists in Auth but not in Firestore, create the document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: new Date().toISOString(),
          licenseKeys: [],
          isActive: true
        });
        
        return {
          success: true,
          message: 'Login successful!',
          user: {
            id: user.uid,
            email: user.email,
            licenseKeys: []
          }
        };
      }
      
      const userData = userDoc.data();
      
      if (!userData.isActive) {
        await signOut(auth);
        return { success: false, message: 'Your account has been deactivated.' };
      }
      
      return {
        success: true,
        message: 'Login successful!',
        user: {
          id: user.uid,
          email: user.email,
          licenseKeys: userData.licenseKeys || []
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle Firebase specific errors
      if (error.code === 'auth/user-not-found') {
        return { success: false, message: 'No account found with this email.' };
      }
      
      if (error.code === 'auth/wrong-password') {
        return { success: false, message: 'Incorrect password.' };
      }
      
      return { success: false, message: error.message || 'Login failed' };
    }
  },

  // Login with license key
  async loginWithLicenseKey(licenseKey, password) {
    try {
      // Validate license key format
      if (!this.isLicenseKeyFormat(licenseKey)) {
        return { success: false, message: 'Invalid license key format.' };
      }
      
      // Look up license key in Firestore
      const licenseQuery = query(
        collection(db, 'licenses'),
        where('key', '==', licenseKey)
      );
      
      const licenseSnapshot = await getDocs(licenseQuery);
      
      if (licenseSnapshot.empty) {
        return { success: false, message: 'Invalid license key.' };
      }
      
      const licenseDoc = licenseSnapshot.docs[0];
      const licenseData = licenseDoc.data();
      
      // Check if license is already associated with a user
      if (licenseData.userId) {
        // Get user by ID
        const userDoc = await getDoc(doc(db, 'users', licenseData.userId));
        
        if (!userDoc.exists()) {
          return { success: false, message: 'User associated with license not found.' };
        }
        
        const userData = userDoc.data();
        
        // We need to sign in with email and password
        if (!userData.email) {
          return { success: false, message: 'User data is incomplete.' };
        }
        
        // Now sign in with the user's email and the provided password
        try {
          const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
          
          return {
            success: true,
            message: 'Login successful!',
            user: {
              id: userCredential.user.uid,
              email: userCredential.user.email,
              licenseKeys: userData.licenseKeys || []
            }
          };
        } catch (signInError) {
          if (signInError.code === 'auth/wrong-password') {
            return { success: false, message: 'Incorrect password for this license key.' };
          }
          throw signInError;
        }
      } else {
        // License not associated with any user, create a temporary account
        const email = `user_${this.generateRandomString(10)}@ultraspoofer.com`;
        
        // Create new user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Add license to user
        await setDoc(doc(db, 'users', user.uid), {
          email,
          createdAt: new Date().toISOString(),
          licenseKeys: [{
            key: licenseKey,
            plan: licenseData.plan,
            activatedAt: new Date().toISOString(),
            expiresAt: licenseData.expiresAt
          }],
          isActive: true
        });
        
        // Update license to mark as used
        await updateDoc(doc(db, 'licenses', licenseDoc.id), {
          used: true,
          userId: user.uid,
          activatedAt: new Date().toISOString()
        });
        
        return {
          success: true,
          message: 'License key activated successfully! A temporary account has been created.',
          user: {
            id: user.uid,
            email: user.email,
            licenseKeys: [{
              key: licenseKey,
              plan: licenseData.plan,
              activatedAt: new Date().toISOString(),
              expiresAt: licenseData.expiresAt
            }]
          }
        };
      }
    } catch (error) {
      console.error('License login error:', error);
      return { success: false, message: error.message || 'License login failed' };
    }
  },

  // Associate a license key with a user
  async addLicenseKeyToUser(licenseKey) {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        return { success: false, message: 'You must be logged in to activate a license key.' };
      }
      
      // Validate license key format
      if (!this.isLicenseKeyFormat(licenseKey)) {
        return { success: false, message: 'Invalid license key format.' };
      }
      
      // Look up license key in Firestore
      const licenseQuery = query(
        collection(db, 'licenses'),
        where('key', '==', licenseKey)
      );
      
      const licenseSnapshot = await getDocs(licenseQuery);
      
      if (licenseSnapshot.empty) {
        return { success: false, message: 'Invalid license key.' };
      }
      
      const licenseDoc = licenseSnapshot.docs[0];
      const licenseData = licenseDoc.data();
      
      // Check if license is already used
      if (licenseData.userId) {
        return { success: false, message: 'This license key has already been used.' };
      }
      
      // Update license to mark as used
      await updateDoc(doc(db, 'licenses', licenseDoc.id), {
        used: true,
        userId: user.uid,
        activatedAt: new Date().toISOString()
      });
      
      // Add license to user's licenseKeys array
      await updateDoc(doc(db, 'users', user.uid), {
        licenseKeys: arrayUnion({
          key: licenseKey,
          plan: licenseData.plan,
          activatedAt: new Date().toISOString(),
          expiresAt: licenseData.expiresAt
        })
      });
      
      return { success: true, message: 'License key activated successfully!' };
    } catch (error) {
      console.error('Add license error:', error);
      return { success: false, message: error.message || 'Failed to activate license key' };
    }
  },

  // Logout the current user
  async logout() {
    try {
      await signOut(auth);
      return { success: true, message: 'Logged out successfully.' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message || 'Logout failed' };
    }
  },

  // Get the current logged in user
  async getCurrentUser() {
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }
    
    try {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        return {
          id: user.uid,
          email: user.email,
          licenseKeys: []
        };
      }
      
      const userData = userDoc.data();
      
      return {
        id: user.uid,
        email: user.email,
        licenseKeys: userData.licenseKeys || [],
        createdAt: userData.createdAt
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        id: user.uid,
        email: user.email,
        licenseKeys: []
      };
    }
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!auth.currentUser;
  },

  // Utility functions
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword(password) {
    // At least 8 characters and contains at least one number or special character
    return password.length >= 8 && /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  },

  isLicenseKeyFormat(text) {
    // Simple license key format check
    return /^ULTRA-SPOOF-\d{4}-[A-Z]{4}$/.test(text);
  },

  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  // Show notification
  showNotification(message, isError = false) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(-10px);
    `;
    
    notification.style.backgroundColor = isError ? '#ef4444' : '#10b981';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  }
};

export default AuthUtils;