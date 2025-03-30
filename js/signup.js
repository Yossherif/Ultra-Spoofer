// Ultra Spoofer Sign Up Page Script

// Import the auth utilities (in a real app, you would use proper imports)
// For this demo, we assume auth-utils.js is loaded before this script

document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication system
  AuthUtils.init();
  
  // Check if user is already logged in
  if (AuthUtils.isLoggedIn()) {
    // In a real app, you would redirect to a dashboard page
    AuthUtils.showNotification('You are already logged in!');
    
    // For demo purposes, just show the current user info
    console.log('Current user:', AuthUtils.getCurrentUser());
  }
  
  // Get form elements
  const signupForm = document.querySelector('.signup-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const termsCheckbox = document.getElementById('terms');
  
  // Add form submission handler
  if (signupForm) {
    signupForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get form values
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsAccepted = termsCheckbox.checked;
      
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
      
      // Attempt registration
      const result = AuthUtils.register(email, password);
      
      if (result.success) {
        AuthUtils.showNotification(result.message);
        
        // Automatically log in the user
        AuthUtils.login(email, password, false);
        
        // In a real app, you would redirect to a dashboard or landing page
        // For demo purposes, we'll simulate a redirect after a delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        AuthUtils.showNotification(result.message, true);
      }
    });
  }
  
  // Add license key section to the form
  function addLicenseKeySection() {
    if (!signupForm) return;
    
    const licenseKeySection = document.createElement('div');
    licenseKeySection.className = 'form-group';
    licenseKeySection.innerHTML = `
      <label for="license-key">License Key (Optional)</label>
      <input type="text" id="license-key" name="license-key" placeholder="e.g. ULTRA-SPOOF-1234-ABCD">
      <p class="form-info">If you have a license key, enter it here to activate your subscription immediately</p>
    `;
    
    // Insert before the terms checkbox
    if (termsCheckbox && termsCheckbox.parentElement) {
      signupForm.insertBefore(licenseKeySection, termsCheckbox.parentElement);
    } else {
      signupForm.appendChild(licenseKeySection);
    }
    
    // Add the license key input to the form submit handler
    const licenseKeyInput = document.getElementById('license-key');
    if (licenseKeyInput && signupForm) {
      const originalSubmit = signupForm.onsubmit;
      signupForm.onsubmit = function(event) {
        const licenseKey = licenseKeyInput.value.trim();
        
        // Call the original submit handler
        if (originalSubmit) originalSubmit(event);
        
        // If registration was successful and a license key was provided
        if (licenseKey && AuthUtils.isLoggedIn()) {
          const currentUser = AuthUtils.getCurrentUser();
          if (currentUser) {
            AuthUtils.addLicenseKeyToUser(currentUser.id, licenseKey);
          }
        }
      };
    }
    
    return licenseKeyInput;
  }
  
  const licenseKeyInput = addLicenseKeySection();
  
  // Add visual feedback for form inputs
  function addInputListeners(inputElement) {
    if (!inputElement) return;
    
    inputElement.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    inputElement.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
      
      // Add validation styling
      if (this.value.trim() === '') {
        this.parentElement.classList.add('error');
      } else {
        this.parentElement.classList.remove('error');
      }
    });
    
    inputElement.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        this.parentElement.classList.remove('error');
      }
    });
  }
  
  // Apply listeners to form inputs
  if (emailInput) addInputListeners(emailInput);
  if (passwordInput) addInputListeners(passwordInput);
  if (confirmPasswordInput) addInputListeners(confirmPasswordInput);
  if (licenseKeyInput) addInputListeners(licenseKeyInput);
  
  // Add password strength indicator
  if (passwordInput) {
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
  
  // Password confirmation match indicator
  if (confirmPasswordInput && passwordInput) {
    function checkPasswordMatch() {
      if (confirmPasswordInput.value === '') return;
      
      if (confirmPasswordInput.value === passwordInput.value) {
        confirmPasswordInput.style.borderColor = '#10b981';
        confirmPasswordInput.parentElement.classList.remove('error');
      } else {
        confirmPasswordInput.style.borderColor = '#ef4444';
        confirmPasswordInput.parentElement.classList.add('error');
      }
    }
    
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    passwordInput.addEventListener('input', function() {
      if (confirmPasswordInput.value !== '') {
        checkPasswordMatch();
      }
    });
  }

  // Add custom styles for focused inputs and validation
  const style = document.createElement('style');
  style.textContent = `
    .form-group.focused input {
      border-color: #00f0ff;
      box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.2);
    }
    
    .form-group.error input {
      border-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  `;
  document.head.appendChild(style);
});