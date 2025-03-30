// firebase-client.js - Client-side script to import Firebase SDK via CDN

// Add Firebase SDK to the page
document.addEventListener('DOMContentLoaded', function() {
  // Add Firebase SDK scripts
  const scripts = [
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
  ];
  
  scripts.forEach(scriptSrc => {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    document.head.appendChild(script);
  });
  
  // Initialize Firebase after scripts are loaded
  const lastScript = document.createElement('script');
  lastScript.async = true;
  lastScript.onload = initializeFirebase;
  lastScript.src = scripts[scripts.length - 1];
  document.head.appendChild(lastScript);
});

function initializeFirebase() {
  // Firebase configuration - replace with your actual config
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Authentication functions for client-side usage
  window.ultraAuth = {
    // Register a new user
    registerUser: async function(email, password, licenseType) {
      try {
        // Create user in Firebase Authentication
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
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
          purchaseDate: firebase.firestore.FieldValue.serverTimestamp(),
          expirationDate: expirationDate ? expirationDate : null,
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          uid: user.uid
        };
        
        // Store user data in Firestore
        await firebase.firestore().collection('users').doc(user.uid).set(userData);
        
        // Send email verification
        await user.sendEmailVerification();
        
        // Store user data in localStorage for easy access
        localStorage.setItem('ultraSpooferUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          licenseKey,
          licenseType,
          expirationDate: expirationDate ? expirationDate.toISOString() : null
        }));
        
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
    },
    
    // Log in a user
    loginUser: async function(email, password) {
      try {
        // Sign in with Firebase Authentication
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          // Check if license is expired
          if (userData.expirationDate && new Date() > userData.expirationDate.toDate()) {
            await firebase.auth().signOut();
            return {
              success: false,
              error: 'Your license has expired. Please renew your subscription.'
            };
          }
          
          // Update last login time
          await firebase.firestore().collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
          
          // Store user data in localStorage for easy access
          localStorage.setItem('ultraSpooferUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            licenseKey: userData.licenseKey,
            licenseType: userData.licenseType,
            expirationDate: userData.expirationDate ? userData.expirationDate.toDate().toISOString() : null
          }));
          
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
          await firebase.auth().signOut();
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
    },
    
    // Login with license key
    loginWithLicenseKey: async function(licenseKey, password) {
      try {
        // Query Firestore for the license key
        const snapshot = await firebase.firestore().collection('users')
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
        
        // Login with email and password
        return await this.loginUser(userData.email, password);
      } catch (error) {
        console.error('License login error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },
    
    // Log out user
    logoutUser: async function() {
      try {
        await firebase.auth().signOut();
        localStorage.removeItem('ultraSpooferUser');
        return { success: true };
      } catch (error) {
        console.error('Logout error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },
    
    // Reset password
    resetPassword: async function(email) {
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        return { success: true };
      } catch (error) {
        console.error('Password reset error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },
    
    // Get current authenticated user
    getCurrentUser: function() {
      const user = firebase.auth().currentUser;
      
      if (user) {
        // Return user data from localStorage if available
        const storedUser = localStorage.getItem('ultraSpooferUser');
        if (storedUser) {
          return JSON.parse(storedUser);
        }
        
        return {
          uid: user.uid,
          email: user.email
        };
      }
      
      return null;
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
      return firebase.auth().currentUser !== null;
    },
    
    // Auth state change listener
    onAuthStateChanged: function(callback) {
      return firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          // Get user data from Firestore
          const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            callback({
              uid: user.uid,
              email: user.email,
              licenseKey: userData.licenseKey,
              licenseType: userData.licenseType,
              expirationDate: userData.expirationDate ? userData.expirationDate.toDate() : null
            });
          } else {
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    }
  };
  
  // Helper functions
  function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let licenseKey = '';
    
    // Generate 5 groups of 5 characters separated by hyphens
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
  
  // Dispatch event when Firebase is ready
  document.dispatchEvent(new Event('firebaseReady'));
}