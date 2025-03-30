// Ultra Spoofer Index Page Script

document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication system
  AuthUtils.init();
  
  // Check if user is logged in
  const isLoggedIn = AuthUtils.isLoggedIn();
  
  // Get navigation links container
  const navLinks = document.querySelector('.nav-links');
  
  if (navLinks) {
    // Update navigation links based on authentication state
    if (isLoggedIn) {
      const currentUser = AuthUtils.getCurrentUser();
      
      // Replace login/signup buttons with user info and dashboard link
      navLinks.innerHTML = `
        <span style="margin-right: 1rem; color: #d1d5db;">${currentUser.email}</span>
        <a href="dashboard.html">
          <button class="btn btn-primary">Dashboard</button>
        </a>
        <button id="logout-btn" class="btn btn-outline">Log Out</button>
      `;
      
      // Add event listener for logout button
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
          AuthUtils.logout();
          window.location.reload();
        });
      }
    }
  }
  
  // Add functionality to the "Buy Now" buttons
  const buyButtons = document.querySelectorAll('.btn-card');
  
  buyButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (isLoggedIn) {
        // If logged in, direct to a payment page or process
        window.location.href = 'dashboard.html';
      } else {
        // If not logged in, direct to the signup page
        window.location.href = 'sign_up.html';
      }
    });
  });

  // Add license key field to pricing cards for logged-in users
  if (isLoggedIn) {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
      const buyButton = card.querySelector('.btn-card');
      
      if (buyButton) {
        // Get the plan type from the card
        const planNameElement = card.querySelector('h3');
        const planName = planNameElement ? planNameElement.textContent.toLowerCase() : 'unknown';
        
        // Replace the button with a form to enter a license key
        const licenseForm = document.createElement('div');
        licenseForm.style.marginTop = '1rem';
        licenseForm.innerHTML = `
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #d1d5db; font-size: 0.9rem;">Have a license key?</label>
            <input type="text" placeholder="Enter license key" class="license-key-input" 
              style="width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #4b5563; background-color: rgba(17, 24, 39, 0.7); color: white; font-size: 0.875rem; margin-bottom: 0.5rem;">
            <button class="activate-key-btn btn-outline" style="width: 100%; padding: 0.5rem; font-size: 0.875rem; display: flex; justify-content: center; border-radius: 0.5rem; background-color: transparent; border: 1px solid #00f0ff; color: #00f0ff; cursor: pointer;">
              Activate Key
            </button>
          </div>
        `;
        
        // Insert the form before the buy button
        buyButton.parentNode.insertBefore(licenseForm, buyButton);
        
        // Add event listener for the activate key button
        const activateKeyBtn = licenseForm.querySelector('.activate-key-btn');
        const licenseKeyInput = licenseForm.querySelector('.license-key-input');
        
        if (activateKeyBtn && licenseKeyInput) {
          activateKeyBtn.addEventListener('click', function() {
            const licenseKey = licenseKeyInput.value.trim();
            
            if (!licenseKey) {
              AuthUtils.showNotification('Please enter a license key.', true);
              return;
            }
            
            if (!AuthUtils.isLicenseKeyFormat(licenseKey)) {
              AuthUtils.showNotification('Invalid license key format. Should be like ULTRA-SPOOF-1234-ABCD', true);
              return;
            }
            
            const currentUser = AuthUtils.getCurrentUser();
            const result = AuthUtils.addLicenseKeyToUser(currentUser.id, licenseKey);
            
            if (result.success) {
              AuthUtils.showNotification(result.message);
              
              // Redirect to dashboard after successful activation
              setTimeout(() => {
                window.location.href = 'dashboard.html';
              }, 1500);
            } else {
              AuthUtils.showNotification(result.message, true);
            }
          });
        }
      }
    });
  }
});