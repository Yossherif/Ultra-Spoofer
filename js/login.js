// Ultra Spoofer Login Page Script

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
  const loginForm = document.querySelector('.login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  
  // Add form submission handler
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get form values
      const emailOrLicenseKey = emailInput.value.trim();
      const password = passwordInput.value;
      const rememberMe = rememberCheckbox.checked;
      
      // Attempt login
      const result = AuthUtils.login(emailOrLicenseKey, password, rememberMe);
      
      if (result.success) {
        AuthUtils.showNotification(result.message);
        
        // In a real app, you would redirect to a dashboard page
        // For demo purposes, we'll simulate a redirect after a delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        AuthUtils.showNotification(result.message, true);
      }
    });
  }
  
  // Add visual feedback for form inputs
  function addInputListeners(inputElement) {
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

  // Add some helpful info about license keys
  if (emailInput) {
    const infoText = document.createElement('p');
    infoText.className = 'form-info';
    infoText.style.cssText = 'color: #d1d5db; font-size: 0.8rem; margin-top: 0.25rem;';
    infoText.textContent = 'You can log in with your email or license key (e.g. ULTRA-SPOOF-1234-ABCD)';
    emailInput.parentElement.appendChild(infoText);
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