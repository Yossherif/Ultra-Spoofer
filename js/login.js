// Ultra Spoofer Login Page Script with Firebase
import AuthUtils from './auth-utils';

document.addEventListener('DOMContentLoaded', function() {
  console.log('Login script loaded');
  
  // Check if AuthUtils is available
  if (typeof AuthUtils === 'undefined') {
    console.error('AuthUtils is not defined. Make sure auth-utils.js is loaded before login.js');
    return;
  }
  
  // Initialize authentication system
  AuthUtils.init();
  
  // Check if user is already logged in
  if (AuthUtils.isLoggedIn()) {
    // Redirect to dashboard if already logged in
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Get form elements
  const loginForm = document.querySelector('.login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  
  // Add form submission handler
  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form values
      const emailOrLicenseKey = emailInput.value.trim();
      const password = passwordInput.value;
      const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;
      
      if (!emailOrLicenseKey || !password) {
        AuthUtils.showNotification('Please enter both email/license and password.', true);
        return;
      }
      
      try {
        // Attempt login
        const result = await AuthUtils.login(emailOrLicenseKey, password, rememberMe);
        
        if (result.success) {
          AuthUtils.showNotification('Login successful! Redirecting to dashboard...');
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          AuthUtils.showNotification(result.message, true);
        }
      } catch (error) {
        console.error('Login error:', error);
        AuthUtils.showNotification('Login failed: ' + error.message, true);
      }
    });
  }
  
  // Add visual feedback for form inputs
  function addInputListeners(inputElement) {
    if (!inputElement) return;
    
    inputElement.addEventListener('focus', function() {
      this.style.borderColor = '#00f0ff';
      this.style.boxShadow = '0 0 0 2px rgba(0, 240, 255, 0.2)';
    });
    
    inputElement.addEventListener('blur', function() {
      this.style.borderColor = '';
      this.style.boxShadow = '';
      
      // Add validation styling
      if (this.value.trim() === '') {
        this.style.borderColor = '#ef4444';
      }
    });
    
    inputElement.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        this.style.borderColor = '';
      }
    });
  }
  
  // Apply listeners to form inputs
  if (emailInput) addInputListeners(emailInput);
  if (passwordInput) addInputListeners(passwordInput);

  // Add info text about license keys
  if (emailInput) {
    // Only add if it doesn't already exist
    if (!document.querySelector('.login-form .form-info')) {
      const infoText = document.createElement('p');
      infoText.className = 'form-info';
      infoText.style.cssText = 'color: #d1d5db; font-size: 0.8rem; margin-top: 0.25rem;';
      infoText.textContent = 'You can log in with your email or license key (e.g. ULTRA-SPOOF-1234-ABCD)';
      emailInput.parentElement.appendChild(infoText);
    }
  }
});