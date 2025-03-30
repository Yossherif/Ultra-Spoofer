// login.js - Firebase integration for log_in.html

document.addEventListener('DOMContentLoaded', function() {
  // Wait for Firebase to be ready
  document.addEventListener('firebaseReady', initializeLogin);
  
  function initializeLogin() {
    // Get form element
    const loginForm = document.querySelector('.login-form');
    
    // Add submit event listener
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form values
      const emailOrLicenseKey = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember').checked;
      
      // Form validation
      if (!emailOrLicenseKey || !password) {
        showError('All fields are required');
        return;
      }
      
      // Show loading state
      const submitButton = document.querySelector('.login-button');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Logging In...';
      submitButton.disabled = true;
      
      try {
        let result;
        
        // Determine if input is an email or license key
        if (emailOrLicenseKey.includes('@')) {
          // Login with email
          result = await window.ultraAuth.loginUser(emailOrLicenseKey, password);
        } else {
          // Login with license key
          result = await window.ultraAuth.loginWithLicenseKey(emailOrLicenseKey, password);
        }
        
        if (result.success) {
          // Store "remember me" preference
          if (rememberMe) {
            localStorage.setItem('ultraSpooferRememberMe', 'true');
          } else {
            localStorage.removeItem('ultraSpooferRememberMe');
          }
          
          // Show success message
          showSuccess('Login successful! Redirecting to dashboard...');
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = './dashboard.html';
          }, 1500);
        } else {
          showError(result.error);
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        }
      } catch (error) {
        showError('An unexpected error occurred. Please try again.');
        console.error('Login error:', error);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
    
    // Add forgot password functionality
    const forgotPasswordLink = document.querySelector('a[href="#"]');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', function(event) {
        event.preventDefault();
        
        // Get email value
        const email = document.getElementById('email').value;
        
        if (!email || !email.includes('@')) {
          showError('Please enter a valid email address to reset your password');
          return;
        }
        
        // Show reset password dialog
        const confirmation = confirm(`We will send a password reset link to ${email}. Continue?`);
        
        if (confirmation) {
          resetPassword(email);
        }
      });
    }
    
    // Reset password function
    async function resetPassword(email) {
      try {
        const result = await window.ultraAuth.resetPassword(email);
        
        if (result.success) {
          showSuccess('Password reset email sent. Please check your inbox.');
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError('Failed to send password reset email. Please try again.');
        console.error('Password reset error:', error);
      }
    }
    
    // Check if "remember me" was previously set
    const rememberMe = localStorage.getItem('ultraSpooferRememberMe');
    if (rememberMe === 'true') {
      document.getElementById('remember').checked = true;
      
      // Redirect if already logged in
      if (window.ultraAuth.isAuthenticated()) {
        window.location.href = './dashboard.html';
      }
    }
    
    // Check for authentication state
    window.ultraAuth.onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in
        const rememberMe = localStorage.getItem('ultraSpooferRememberMe');
        if (rememberMe === 'true') {
          window.location.href = './dashboard.html';
        }
      }
    });
  }
  
  // Function to show error message
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#ff4d4d';
    errorDiv.style.padding = '0.75rem';
    errorDiv.style.marginTop = '1rem';
    errorDiv.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
    errorDiv.style.borderRadius = '0.5rem';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Insert error before the submit button
    const submitButton = document.querySelector('.login-button');
    submitButton.parentNode.insertBefore(errorDiv, submitButton);
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Function to show success message
  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.