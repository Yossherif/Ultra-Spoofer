const { auth, db } = require('./utils/firebase-admin');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Verify Firebase token
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: 'Authentication required.'
        })
      };
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const { licenseKey } = JSON.parse(event.body);
    
    // Check if license exists
    const licenseSnapshot = await db.collection('licenses')
      .where('key', '==', licenseKey)
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
    const licenseData = licenseDoc.data();
    
    // Check if license is already used
    if (licenseData.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'This license key has already been used.'
        })
      };
    }
    
    // Update license to mark as used
    await db.collection('licenses').doc(licenseDoc.id).update({
      userId: uid,
      activatedAt: new Date().toISOString()
    });
    
    // Add license to user
    const userRef = db.collection('users').doc(uid);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw 'User document does not exist!';
      }
      
      const userData = userDoc.data();
      const licenseKeys = userData.licenseKeys || [];
      
      licenseKeys.push({
        key: licenseKey,
        plan: licenseData.plan,
        activatedAt: new Date().toISOString(),
        expiresAt: licenseData.expiresAt
      });
      
      transaction.update(userRef, { licenseKeys });
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'License key activated successfully!'
      })
    };
  } catch (error) {
    console.error('Add license error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error while activating license.'
      })
    };
  }
};