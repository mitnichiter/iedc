import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'UID of the target user must be provided.' }, { status: 400 });
    }

    try {
      await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
      const userDocRef = adminDb.collection('users').doc(uid);
      // Use set with merge to avoid errors if the document doesn't exist yet for some reason
      await userDocRef.set({ role: 'admin' }, { merge: true });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'The specified user to grant admin role was not found in Firebase Authentication.' }, { status: 404 });
      }
      console.error('Error granting admin role:', error);
      return NextResponse.json({ error: 'Failed to grant admin role.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Successfully granted admin role to user ${uid}.` });

  } catch (error) {
    console.error('Error in grant-admin-role route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
