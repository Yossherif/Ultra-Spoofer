const { db } = require('./utils/firebase-admin');

// Generate a random license key in the format ULTRA-SPOOF-XXXX-YYYY
function generateLicenseKey() {
  const numPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  const charsPart = Array.from({length: 4}, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  ).join('');
  
  return `ULTRA-SPOOF-${numPart}-${charsPart}`;
}

// Get expiry date based on plan
function getExpiryDate(plan) {
  const now = new Date();
  
  switch(plan) {
    case 'monthly':
      now.setDate(now.getDate() + 30);
      return now.toISOString();
    case 'annual':
      now.setDate(now.getDate() + 365);
      return now.toISOString();
    case 'lifetime':
      return null;
    default:
      return null;
  }
}

exports.handler = async (event) => {
  // Only allow POST and with a secret key
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  try {
    const { secretKey, plan, quantity } = JSON.parse(event.body);
    
    // Verify the secret key matches
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return { statusCode: 403, body: "Unauthorized" };
    }
    
    // Validate plan
    if (!['monthly', 'annual', 'lifetime'].includes(plan)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Invalid plan. Must be monthly, annual, or lifetime.'
        })
      };
    }
    
    // Determine how many keys to generate (default to 1)
    const keyCount = quantity && !isNaN(parseInt(quantity)) ? parseInt(quantity) : 1;
    if (keyCount < 1 || keyCount > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Quantity must be between 1 and 100.'
        })
      };
    }
    
    // Generate the requested number of license keys
    const generatedKeys = [];
    const batch = db.batch();
    
    for (let i = 0; i < keyCount; i++) {
      // Generate a unique license key
      let licenseKey;
      let isUnique = false;
      
      while (!isUnique) {
        licenseKey = generateLicenseKey();
        
        // Check if this key already exists
        const existingDoc = await db.collection('licenses').doc(licenseKey).get();
        if (!existingDoc.exists) {
          isUnique = true;
        }
      }
      
      // Create the license data
      const licenseData = {
        key: licenseKey,
        plan,
        expiresAt: getExpiryDate(plan),
        used: false,
        userId: null,
        activatedAt: null,
        createdAt: new Date().toISOString()
      };
      
      // Add to batch write
      const docRef = db.collection('licenses').doc(licenseKey);
      batch.set(docRef, licenseData);
      
      // Add to the result list
      generatedKeys.push(licenseKey);
    }
    
    // Commit all the license creations
    await batch.commit();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Successfully generated ${keyCount} license keys.`,
        keys: generatedKeys
      })
    };
  } catch (error) {
    console.error('Error generating license keys:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error generating license keys.'
      })
    };
  }
};