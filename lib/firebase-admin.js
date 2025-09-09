import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  // If FIREBASE_SERVICE_ACCOUNT_KEY is set, use it. Otherwise, use default credentials.
  // This supports both local development (with a .env.local file) and Vercel deployments (with environment variables)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // or the default service account on Google Cloud platforms like Cloud Run.
    admin.initializeApp();
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
