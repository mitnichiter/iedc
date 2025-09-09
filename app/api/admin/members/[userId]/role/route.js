import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req, { params }) {
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

    const { userId } = params;
    const { newRole } = await req.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'User ID and new role must be provided.' }, { status: 400 });
    }

    const validRoles = ['student', 'admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
    }

    try {
      await adminAuth.setCustomUserClaims(userId, { role: newRole });
      const userDocRef = adminDb.collection('users').doc(userId);
      await userDocRef.update({ role: newRole });
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'The specified user to update was not found.' }, { status: 404 });
      }
      console.error('Error setting user role:', error);
      return NextResponse.json({ error: 'Failed to set user role.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `User ${userId} role updated to ${newRole}.` });

  } catch (error) {
    console.error('Error in set-user-role route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
