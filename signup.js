// signup.js - Firebase integration for sign_up.html

document.addEventListener('DOMContentLoaded', function() {
  // Wait for Firebase to be ready
  document.addEventListener('firebaseReady', initializeSignup);
  
  function initializeSignup() {
    // Get form element
    const signupForm = document.querySelector('.signup-form');
    
    // Add submit event listener
    signupForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      
      // Get form values
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const termsAccepted = document.getElementById('terms').checked;
      
      // Form validation
      if (!email || !password || !confirmPassword) {
        showError('All fields are required');
        return;
      }
      
      if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }
      
      if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
      }
      
      if (!termsAccepted) {
        showError('You must accept the terms');
        return;
      }
      
      // Default to annual license (best value)
      const licenseType = 'annual';
      
      // Show loading state
      const submitButton = document.querySelector('.signup-button');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Creating Account...';
      submitButton.disabled = true;
      
      try {
        // Call the register function
        const result = await window.ultraAuth.registerUser(email, password, licenseType);
        
        if (result.success) {
          // Show success message
          showSuccess('Account created successfully! Redirecting to dashboard...');
          
          // Wait for Firebase Auth state to update
          setTimeout(() => {
            window.location.href = './dashboard.html';
          }, 2000);
        } else {
          showError(result.error);
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        }
      } catch (error) {
        showError('An unexpected error occurred. Please try again.');
        console.error('Signup error:', error);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
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
    const submitButton = document.querySelector('.signup-button');
    submitButton.parentNode.insertBefore(errorDiv, submitButton);
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Function to show success message
  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.color = '#00f0ff';
    successDiv.style.padding = '0.75rem';
    successDiv.style.marginTop = '1rem';
    successDiv.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
    successDiv.style.borderRadius = '0.5rem';
    successDiv.style.textAlign = 'center';
    successDiv.textContent = message;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }
    
    // Insert success before the submit button
    const submitButton = document.querySelector('.signup-button');
    submitButton.parentNode.insertBefore(successDiv, submitButton);
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth' });
  }
});