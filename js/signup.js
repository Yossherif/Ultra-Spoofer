// Ultra Spoofer Sign Up Page Script

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
    signupForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get form values
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const termsAccepted = termsCheckbox ? termsCheckbox.checked : false;
      
      // Basic validation
      if (email === '' || password === '' || confirmPassword === '') {
        showNotification('Please fill in all fields.', true);
        return;
      }
      
      if (!AuthUtils.validateEmail(email)) {
        showNotification('Please enter a valid email address.', true);
        return;
      }
      
      if (password !== confirmPassword) {
        showNotification('Passwords do not match.', true);
        return;
      }
      
      if (!AuthUtils.validatePassword(password)) {
        showNotification('Password must be at least 8 characters long and include at least one number or symbol.', true);
        return;
      }
      
      if (!termsAccepted) {
        showNotification('You must accept the terms to continue.', true);
        return;
      }
      
      // Attempt registration
      const result = AuthUtils.register(email, password);
      
      if (result.success) {
        showNotification('Account created successfully! Logging you in...');
        
        // Automatically log in the user
        const loginResult = AuthUtils.login(email, password, false);
        
        if (loginResult.success) {
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          showNotification('Account created but login failed. Please try logging in manually.', true);
          setTimeout(() => {
            window.location.href = 'log_in.html';
          }, 2000);
        }
      } else {
        showNotification(result.message, true);
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

  // Use AuthUtils.showNotification instead of creating our own
  function showNotification(message, isError = false) {
    AuthUtils.showNotification(message, isError);
  }
});