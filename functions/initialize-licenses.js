const { db } = require('./utils/firebase-admin');

// Get expiry date based on plan
function getExpiryDate(days) {
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

exports.handler = async (event) => {
  // Only allow POST and with a secret key
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  try {
    const { secretKey } = JSON.parse(event.body);
    
    // Verify the secret key matches
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return { statusCode: 403, body: "Unauthorized" };
    }
    
    // Sample license keys
    const sampleKeys = [
      { key: 'ULTRA-SPOOF-1234-ABCD', used: false, plan: 'monthly', expiresAt: getExpiryDate(30) },
      { key: 'ULTRA-SPOOF-5678-EFGH', used: false, plan: 'annual', expiresAt: getExpiryDate(365) },
      { key: 'ULTRA-SPOOF-9012-IJKL', used: false, plan: 'lifetime', expiresAt: null }
    ];
    
    // Add each license to Firestore
    const batch = db.batch();
    
    for (const license of sampleKeys) {
      const docRef = db.collection('licenses').doc(license.key);
      batch.set(docRef, license);
    }
    
    await batch.commit();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Sample license keys initialized successfully!'
      })
    };
  } catch (error) {
    console.error('Error initializing licenses:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error initializing licenses.'
      })
    };
  }
};