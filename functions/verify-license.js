const { db } = require('./utils/firebase-admin');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  
  try {
    const { licenseKey } = JSON.parse(event.body);
    
    // Check if license exists
    const licenseDoc = await db.collection('licenses')
      .doc(licenseKey)
      .get();
    
    if (!licenseDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'Invalid license key.'
        })
      };
    }
    
    const licenseData = licenseDoc.data();
    
    // Check if license is already used
    if (licenseData.used) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: 'This license key has already been used.',
          isUsed: true
        })
      };
    }
    
    // Check if license is expired
    if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: 'This license key has expired.',
          isExpired: true
        })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'License key is valid.',
        plan: licenseData.plan,
        expiresAt: licenseData.expiresAt
      })
    };
  } catch (error) {
    console.error('Error verifying license:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error verifying license.'
      })
    };
  }
};