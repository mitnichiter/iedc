import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function DELETE(req, { params }) {
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
    if (!userId) {
      return NextResponse.json({ error: 'User ID to delete must be provided.' }, { status: 400 });
    }

    if (decodedToken.uid === userId) {
        return NextResponse.json({ error: 'Admins cannot delete their own account through this function.' }, { status: 403 });
    }

    try {
      await adminAuth.deleteUser(userId);
      const userDocRef = adminDb.collection('users').doc(userId);
      await userDocRef.delete();
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'The specified user to delete was not found in Firebase Authentication.' }, { status: 404 });
      }
      console.error('Error deleting user account:', error);
      return NextResponse.json({ error: 'Failed to delete user account.' }, { status: 500 });
    }

    // TODO: Consider deleting other user-associated data if necessary

    return NextResponse.json({ success: true, message: `User ${userId} and their data have been deleted.` });

  } catch (error) {
    console.error('Error in delete-user route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
