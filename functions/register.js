const { auth, db } = require('./utils/firebase-admin');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    
    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });
    
    // Store additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      createdAt: new Date().toISOString(),
      licenseKeys: [],
      isActive: true,
    });
    
    // Create a custom token for the client
    const token = await auth.createCustomToken(userRecord.uid);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          licenseKeys: [],
          token,
        }
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for specific Firebase error codes
    let message = 'Server error while creating account.';
    
    if (error.code === 'auth/email-already-exists') {
      message = 'An account with this email already exists.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/invalid-password') {
      message = 'Password must be at least 6 characters.';
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message,
      })
    };
  }
};