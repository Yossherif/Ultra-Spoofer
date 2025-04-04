// Ultra Spoofer Dashboard Script with Firebase

import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthUtils from './auth-utils';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication system
  AuthUtils.init();
  
  // Check if user is logged in using Firebase Auth
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Redirect to login page if not logged in
      window.location.href = 'log_in.html';
      return;
    }
    
    // Get user data from Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update the UI with user data
        updateUIWithUserData({
          id: user.uid,
          email: user.email,
          licenseKeys: userData.licenseKeys || [],
          createdAt: userData.createdAt
        });
      } else {
        // User exists in Auth but not in Firestore
        console.error('User document not found in Firestore');
        AuthUtils.showNotification('User data could not be loaded. Please try logging in again.', true);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      AuthUtils.showNotification('Error loading user data: ' + error.message, true);
    }
  });
  
  // Handle logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      try {
        const result = await AuthUtils.logout();
        if (result.success) {
          window.location.href = 'index.html';
        } else {
          AuthUtils.showNotification(result.message, true);
        }
      } catch (error) {
        console.error('Logout error:', error);
        AuthUtils.showNotification('Error during logout: ' + error.message, true);
      }
    });
  }
  
  // Demo download button
  const downloadBtn = document.querySelector('.dashboard-card .btn-primary');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async function() {
      const currentUser = await AuthUtils.getCurrentUser();
      const hasActiveLicense = currentUser?.licenseKeys && currentUser.licenseKeys.length > 0;
      
      if (hasActiveLicense) {
        AuthUtils.showNotification('Download started. Your spoofer will be downloaded shortly.');
        // In a real app, this would trigger the actual download
        // window.location.href = 'downloads/ultra-spoofer-v2.5.1.zip';
      } else {
        AuthUtils.showNotification('You need an active license to download Ultra Spoofer.', true);
      }
    });
  }
});

// Update the UI with user data
function updateUIWithUserData(user) {
  // Update email in navbar
  const userEmailElement = document.getElementById('user-email');
  if (userEmailElement) {
    userEmailElement.textContent = user.email;
  }
  
  // Update account information section
  const accountEmailElement = document.getElementById('account-email');
  if (accountEmailElement) {
    accountEmailElement.textContent = user.email;
  }
  
  // Format creation date
  const accountCreatedElement = document.getElementById('account-created');
  if (accountCreatedElement && user.createdAt) {
    const createdDate = new Date(user.createdAt);
    accountCreatedElement.textContent = createdDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Update license list
  updateLicenseList(user);
}

// Update the license list UI
function updateLicenseList(user) {
  const licenseListElement = document.getElementById('license-list');
  if (!licenseListElement) return;
  
  // Clear current content
  licenseListElement.innerHTML = '';
  
  // Check if user has any licenses
  if (!user.licenseKeys || user.licenseKeys.length === 0) {
    licenseListElement.innerHTML = `
      <div class="license-item">
        <div class="license-details">
          <span class="license-key">No Licenses</span>
          <span class="license-plan">You don't have any active licenses</span>
        </div>
        <a href="index.html" class="btn btn-outline" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;">Buy License</a>
      </div>
    `;
    return;
  }
  
  // Add each license to the list
  user.licenseKeys.forEach(license => {
    const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();
    
    // Format expiry date or show 'Never' for lifetime licenses
    let expiryText = 'Never Expires';
    if (license.expiresAt) {
      const expiryDate = new Date(license.expiresAt);
      expiryText = isExpired ? 
        'Expired on ' + expiryDate.toLocaleDateString() : 
        'Expires on ' + expiryDate.toLocaleDateString();
    }
    
    // Create license item element
    const licenseItem = document.createElement('div');
    licenseItem.className = 'license-item';
    licenseItem.innerHTML = `
      <div class="license-details">
        <span class="license-key">${license.key}</span>
        <span class="license-plan">${capitalizeFirstLetter(license.plan)} Plan - ${expiryText}</span>
      </div>
      <span class="license-status ${isExpired ? 'status-expired' : 'status-active'}">
        ${isExpired ? 'Expired' : 'Active'}
      </span>
    `;
    
    licenseListElement.appendChild(licenseItem);
  });

  // Add option to add a new license key
  const addLicenseItem = document.createElement('div');
  addLicenseItem.className = 'license-item';
  addLicenseItem.style.backgroundColor = 'rgba(0, 240, 255, 0.05)';
  addLicenseItem.style.border = '1px dashed #00f0ff';
  addLicenseItem.innerHTML = `
    <div class="license-details">
      <span style="font-weight: bold;">Add a license key</span>
      <span class="license-plan">Have a new license key? Activate it here</span>
    </div>
    <button id="add-license-btn" class="btn btn-outline" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;">
      Add License
    </button>
  `;
  
  licenseListElement.appendChild(addLicenseItem);
  
  // Add event listener for the add license button
  const addLicenseBtn = document.getElementById('add-license-btn');
  if (addLicenseBtn) {
    addLicenseBtn.addEventListener('click', function() {
      showAddLicenseModal();
    });
  }
}

// Show add license modal
async function showAddLicenseModal() {
  // Create modal element
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  // Create modal content
  modal.innerHTML = `
    <div style="background-color: #1f2937; border-radius: 0.5rem; padding: 2rem; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);">
      <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Add License Key</h2>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; color: #d1d5db; font-size: 0.9rem;">License Key</label>
        <input id="license-key-input" type="text" placeholder="e.g. ULTRA-SPOOF-1234-ABCD" style="width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #4b5563; background-color: rgba(17, 24, 39, 0.7); color: white; font-size: 1rem;">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 1rem;">
        <button id="cancel-modal" class="btn btn-outline" style="padding: 0.5rem 1rem;">Cancel</button>
        <button id="submit-license" class="btn btn-primary" style="padding: 0.5rem 1rem;">Activate</button>
      </div>
    </div>
  `;
  
  // Add modal to the DOM
  document.body.appendChild(modal);
  
  // Add event listeners for the modal buttons
  document.getElementById('cancel-modal').addEventListener('click', function() {
    document.body.removeChild(modal);
  });
  
  document.getElementById('submit-license').addEventListener('click', async function() {
    const licenseKey = document.getElementById('license-key-input').value.trim();
    
    if (!licenseKey) {
      AuthUtils.showNotification('Please enter a license key.', true);
      return;
    }
    
    // Validate license key format
    if (!AuthUtils.isLicenseKeyFormat(licenseKey)) {
      AuthUtils.showNotification('Invalid license key format. Should be like ULTRA-SPOOF-1234-ABCD', true);
      return;
    }
    
    try {
      // Add license key to user
      const result = await AuthUtils.addLicenseKeyToUser(licenseKey);
      
      if (result.success) {
        AuthUtils.showNotification(result.message);
        document.body.removeChild(modal);
        
        // Update the UI with the new license
        const currentUser = await AuthUtils.getCurrentUser();
        updateLicenseList(currentUser);
      } else {
        AuthUtils.showNotification(result.message, true);
      }
    } catch (error) {
      console.error('Add license error:', error);
      AuthUtils.showNotification('Error activating license: ' + error.message, true);
    }
  });
  
  // Focus the input field
  document.getElementById('license-key-input').focus();
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}