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
    if (!userId) {
      return NextResponse.json({ error: 'User ID to approve must be provided.' }, { status: 400 });
    }

    const userDocRef = adminDb.collection('users').doc(userId);

    try {
      await userDocRef.update({
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
    } catch (error) {
        if (error.code === 5) { // Firestore error code for NOT_FOUND
            return NextResponse.json({ error: 'The specified user to approve was not found in Firestore.' }, { status: 404 });
        }
        console.error('Error approving user:', error);
        return NextResponse.json({ error: 'Failed to approve user.' }, { status: 500 });
    }

    // TODO: Optionally send a welcome/approval email to the user here.

    return NextResponse.json({ success: true, message: `User ${userId} has been approved.` });

  } catch (error) {
    console.error('Error in approve-user route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
