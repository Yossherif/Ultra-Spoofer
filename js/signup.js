// Ultra Spoofer Sign Up Page Script with Firebase
import AuthUtils from './auth-utils';

document.addEventListener('DOMContentLoaded', function() {
  console.log('Signup script loaded');
  
  // Check if AuthUtils is available
  if (typeof AuthUtils === 'undefined') {
    console.error('AuthUtils is not defined. Make sure auth-utils.js is loaded before signup.js');
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
  const signupForm = document.querySelector('.signup-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsCheckbox = document.getElementById('terms');
  
  // Add form submission handler
  if (signupForm) {
    signupForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form values
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsAccepted = termsCheckbox ? termsCheckbox.checked : false;
      
      // Basic validation
      if (email === '' || password === '' || confirmPassword === '') {
        AuthUtils.showNotification('Please fill in all fields.', true);
        return;
      }
      
      if (!AuthUtils.validateEmail(email)) {
        AuthUtils.showNotification('Please enter a valid email address.', true);
        return;
      }
      
      if (password !== confirmPassword) {
        AuthUtils.showNotification('Passwords do not match.', true);
        return;
      }
      
      if (!AuthUtils.validatePassword(password)) {
        AuthUtils.showNotification('Password must be at least 8 characters long and include at least one number or symbol.', true);
        return;
      }
      
      if (!termsAccepted) {
        AuthUtils.showNotification('You must accept the terms to continue.', true);
        return;
      }
      
      try {
        // Attempt registration
        const result = await AuthUtils.register(email, password);
        
        if (result.success) {
          AuthUtils.showNotification('Account created successfully! Logging you in...');
          
          // Automatically log in the user
          const loginResult = await AuthUtils.login(email, password, false);
          
          if (loginResult.success) {
            // Redirect to dashboard
            setTimeout(() => {
              window.location.href = 'dashboard.html';
            }, 1500);
          } else {
            AuthUtils.showNotification('Account created but login failed. Please try logging in manually.', true);
            setTimeout(() => {
              window.location.href = 'log_in.html';
            }, 2000);
          }
        } else {
          AuthUtils.showNotification(result.message, true);
        }
      } catch (error) {
        console.error('Registration error:', error);
        AuthUtils.showNotification('Registration failed: ' + error.message, true);
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
  if (confirmPasswordInput) addInputListeners(confirmPasswordInput);
  
  // Password confirmation match indicator
  if (confirmPasswordInput && passwordInput) {
    function checkPasswordMatch() {
      if (confirmPasswordInput.value === '') return;
      
      if (confirmPasswordInput.value === passwordInput.value) {
        confirmPasswordInput.style.borderColor = '#10b981';
      } else {
        confirmPasswordInput.style.borderColor = '#ef4444';
      }
    }
    
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    passwordInput.addEventListener('input', function() {
      if (confirmPasswordInput.value !== '') {
        checkPasswordMatch();
      }
    });
  }

  // Add password strength indicator
  if (passwordInput && !document.querySelector('.password-strength')) {
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.style.cssText = `
      height: 4px;
      margin-top: 4px;
      border-radius: 2px;
      transition: all 0.3s ease;
      background-color: #ef4444;
      width: 0%;
    `;
    
    passwordInput.parentElement.appendChild(strengthIndicator);
    
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      let strength = 0;
      
      // Length check
      if (password.length >= 8) strength += 25;
      
      // Character variety checks
      if (/[0-9]/.test(password)) strength += 25;
      if (/[a-z]/.test(password)) strength += 25;
      if (/[A-Z]/.test(password)) strength += 15;
      if (/[^0-9a-zA-Z]/.test(password)) strength += 10;
      
      // Cap at 100%
      strength = Math.min(100, strength);
      
      // Update the indicator
      strengthIndicator.style.width = strength + '%';
      
      // Color based on strength
      if (strength < 30) {
        strengthIndicator.style.backgroundColor = '#ef4444'; // Red
      } else if (strength < 60) {
        strengthIndicator.style.backgroundColor = '#f59e0b'; // Orange
      } else {
        strengthIndicator.style.backgroundColor = '#10b981'; // Green
      }
    });
  }
});