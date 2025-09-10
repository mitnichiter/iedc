import admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  // Ensure the single environment variable is available
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Firebase Admin SDK environment variable "FIREBASE_SERVICE_ACCOUNT_KEY" is not defined.');
  }

  try {
    // Parse the JSON string from the environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    // Initialize the app with the parsed credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:', error);
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not a valid JSON string.');
  }
}

export const adminAuth = admin.auth();
export const db = admin.firestore();
export default admin;
