// Ultra Spoofer Authentication Utilities

// User database simulation using localStorage
const AuthUtils = {
  // Initialize the auth system
  init() {
    if (!localStorage.getItem('ultraSpooferUsers')) {
      localStorage.setItem('ultraSpooferUsers', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('ultraSpooferLicenseKeys')) {
      // Add some sample license keys (in a real app, these would come from a secure backend)
      const sampleKeys = [
        { key: 'ULTRA-SPOOF-1234-ABCD', used: false, plan: 'monthly', expiresAt: this.getExpiryDate(30) },
        { key: 'ULTRA-SPOOF-5678-EFGH', used: false, plan: 'annual', expiresAt: this.getExpiryDate(365) },
        { key: 'ULTRA-SPOOF-9012-IJKL', used: false, plan: 'lifetime', expiresAt: null }
      ];
      localStorage.setItem('ultraSpooferLicenseKeys', JSON.stringify(sampleKeys));
    }

    // Check if user is already logged in
    const currentUser = localStorage.getItem('ultraSpooferCurrentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      // Check if "remember me" was checked, otherwise clear on page refresh
      if (!userData.rememberMe) {
        this.logout();
      } else {
        // Check if token is expired
        if (userData.expiresAt && new Date(userData.expiresAt) < new Date()) {
          this.logout();
        }
      }
    }
  },

  // Register a new user
  register(email, password) {
    // Basic validation
    if (!this.validateEmail(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    
    if (!this.validatePassword(password)) {
      return { success: false, message: 'Password must be at least 8 characters long and include at least one number or symbol.' };
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('ultraSpooferUsers'));
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    
    // Create new user
    const newUser = {
      id: this.generateUserId(),
      email,
      // In a real app, you would hash the password
      password,
      createdAt: new Date().toISOString(),
      licenseKeys: [],
      isActive: true
    };
    
    users.push(newUser);
    localStorage.setItem('ultraSpooferUsers', JSON.stringify(users));
    
    return { success: true, message: 'Account created successfully!', user: { ...newUser, password: undefined } };
  },

  // Login with email and password
  login(emailOrLicenseKey, password, rememberMe = false) {
    if (!emailOrLicenseKey || !password) {
      return { success: false, message: 'Please enter both email/license and password.' };
    }
    
    const users = JSON.parse(localStorage.getItem('ultraSpooferUsers'));

    // First check if it's a license key login
    if (this.isLicenseKeyFormat(emailOrLicenseKey)) {
      return this.loginWithLicenseKey(emailOrLicenseKey, password, rememberMe);
    }
    
    // Otherwise, try email login
    const user = users.find(user => user.email.toLowerCase() === emailOrLicenseKey.toLowerCase());
    
    if (!user) {
      return { success: false, message: 'No account found with this email.' };
    }
    
    if (user.password !== password) {
      return { success: false, message: 'Incorrect password.' };
    }
    
    if (!user.isActive) {
      return { success: false, message: 'Your account has been deactivated.' };
    }
    
    // Set current user in storage
    const currentUser = {
      id: user.id,
      email: user.email,
      licenseKeys: user.licenseKeys,
      rememberMe,
      expiresAt: rememberMe ? null : this.getSessionExpiryTime()
    };
    
    localStorage.setItem('ultraSpooferCurrentUser', JSON.stringify(currentUser));
    
    return { success: true, message: 'Login successful!', user: currentUser };
  },

  // Login with license key
  loginWithLicenseKey(licenseKey, password, rememberMe = false) {
    // Validate license key format
    if (!this.isLicenseKeyFormat(licenseKey)) {
      return { success: false, message: 'Invalid license key format.' };
    }
    
    // Check if license key exists
    const licenseKeys = JSON.parse(localStorage.getItem('ultraSpooferLicenseKeys'));
    const licenseKeyData = licenseKeys.find(lk => lk.key === licenseKey);
    
    if (!licenseKeyData) {
      return { success: false, message: 'Invalid license key.' };
    }
    
    // Check if license key is already used and associated with an account
    const users = JSON.parse(localStorage.getItem('ultraSpooferUsers'));
    const userWithLicense = users.find(user => 
      user.licenseKeys.some(userKey => userKey.key === licenseKey)
    );
    
    if (userWithLicense) {
      // If the license is already used, check if the password matches
      if (userWithLicense.password !== password) {
        return { success: false, message: 'Incorrect password for this license key.' };
      }
      
      // Set current user in storage
      const currentUser = {
        id: userWithLicense.id,
        email: userWithLicense.email,
        licenseKeys: userWithLicense.licenseKeys,
        rememberMe,
        expiresAt: rememberMe ? null : this.getSessionExpiryTime()
      };
      
      localStorage.setItem('ultraSpooferCurrentUser', JSON.stringify(currentUser));
      
      return { success: true, message: 'Login successful!', user: currentUser };
    } else {
      // If the license is not associated with any account yet
      // In a real app, you would prompt the user to create an account
      // For this implementation, we'll create a temporary account
      const newUserId = this.generateUserId();
      const newUser = {
        id: newUserId,
        email: `user_${newUserId}@example.com`, // Temporary email
        password, // Use the provided password
        createdAt: new Date().toISOString(),
        licenseKeys: [{ 
          key: licenseKey, 
          plan: licenseKeyData.plan, 
          activatedAt: new Date().toISOString(),
          expiresAt: licenseKeyData.expiresAt 
        }],
        isActive: true
      };
      
      // Mark the license key as used
      licenseKeyData.used = true;
      localStorage.setItem('ultraSpooferLicenseKeys', JSON.stringify(licenseKeys));
      
      // Add the new user
      users.push(newUser);
      localStorage.setItem('ultraSpooferUsers', JSON.stringify(users));
      
      // Set current user in storage
      const currentUser = {
        id: newUser.id,
        email: newUser.email,
        licenseKeys: newUser.licenseKeys,
        rememberMe,
        expiresAt: rememberMe ? null : this.getSessionExpiryTime()
      };
      
      localStorage.setItem('ultraSpooferCurrentUser', JSON.stringify(currentUser));
      
      return { 
        success: true, 
        message: 'License key activated successfully! A temporary account has been created.', 
        user: currentUser 
      };
    }
  },

  // Associate a license key with a user
  addLicenseKeyToUser(userId, licenseKey) {
    // Check if license key exists and is not used
    const licenseKeys = JSON.parse(localStorage.getItem('ultraSpooferLicenseKeys'));
    const licenseKeyIndex = licenseKeys.findIndex(lk => lk.key === licenseKey);
    
    if (licenseKeyIndex === -1) {
      return { success: false, message: 'Invalid license key.' };
    }
    
    const licenseKeyData = licenseKeys[licenseKeyIndex];
    
    if (licenseKeyData.used) {
      return { success: false, message: 'This license key has already been used.' };
    }
    
    // Find the user
    const users = JSON.parse(localStorage.getItem('ultraSpooferUsers'));
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }
    
    // Add license key to user
    users[userIndex].licenseKeys.push({
      key: licenseKey,
      plan: licenseKeyData.plan,
      activatedAt: new Date().toISOString(),
      expiresAt: licenseKeyData.expiresAt
    });
    
    // Mark license key as used
    licenseKeys[licenseKeyIndex].used = true;
    
    // Update storage
    localStorage.setItem('ultraSpooferUsers', JSON.stringify(users));
    localStorage.setItem('ultraSpooferLicenseKeys', JSON.stringify(licenseKeys));
    
    // Update current user if this is the current user
    const currentUserData = localStorage.getItem('ultraSpooferCurrentUser');
    if (currentUserData) {
      const currentUser = JSON.parse(currentUserData);
      if (currentUser.id === userId) {
        currentUser.licenseKeys = users[userIndex].licenseKeys;
        localStorage.setItem('ultraSpooferCurrentUser', JSON.stringify(currentUser));
      }
    }
    
    return { success: true, message: 'License key activated successfully!' };
  },

  // Logout the current user
  logout() {
    localStorage.removeItem('ultraSpooferCurrentUser');
    return { success: true, message: 'Logged out successfully.' };
  },

  // Get the current logged in user
  getCurrentUser() {
    const userData = localStorage.getItem('ultraSpooferCurrentUser');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getCurrentUser();
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
    // Simple license key format check (adjust based on your actual format)
    return /^ULTRA-SPOOF-\d{4}-[A-Z]{4}$/.test(text);
  },

  generateUserId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  getSessionExpiryTime() {
    // Session expires in 24 hours
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    return expiryDate.toISOString();
  },

  getExpiryDate(days) {
    if (!days) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
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