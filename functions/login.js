const { auth, db } = require('./utils/firebase-admin');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { emailOrLicenseKey, password } = JSON.parse(event.body);
    
    let userId;
    
    // Check if input is a license key
    if (emailOrLicenseKey.match(/^ULTRA-SPOOF-\d{4}-[A-Z]{4}$/)) {
      // Find license by key
      const licenseSnapshot = await db.collection('licenses')
        .where('key', '==', emailOrLicenseKey)
        .limit(1)
        .get();
      
      if (licenseSnapshot.empty) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: 'Invalid license key.'
          })
        };
      }
      
      const licenseDoc = licenseSnapshot.docs[0];
      
      if (licenseDoc.data().userId) {
        // License is already associated with a user
        userId = licenseDoc.data().userId;
        
        // Firebase doesn't let us log in directly with a license key,
        // so we need to find the user's email
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              success: false,
              message: 'User account associated with this license not found.'
            })
          };
        }
        
        // Now we need to sign in through the Firebase Admin SDK
        // For security, we'll need to get the user's token after verifying password
        // This is handled through the client-side Firebase Auth
        
        // Generate a custom token for the user
        const token = await auth.createCustomToken(userId);
        
        // Return user data and token
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Login with license key successful. Please use this token to authenticate.',
            user: {
              id: userId,
              email: userDoc.data().email,
              licenseKeys: userDoc.data().licenseKeys || [],
              token,
            }
          })
        };
      } else {
        // License exists but isn't associated with a user yet
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: 'This license key hasn\'t been activated yet. Please sign up first.'
          })
        };
      }
    } else {
      // Regular email login (handled on client side through Firebase Auth)
      // For server-side verification, we'd need to use Firebase Admin SDK to sign in
      // But this isn't directly supported - we need to verify credentials on client first
      
      // Return a message to use client-side auth
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: 'Please use client-side authentication',
          useClientAuth: true
        })
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error during login.'
      })
    };
  }
};