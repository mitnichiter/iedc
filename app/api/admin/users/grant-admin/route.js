import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ success: false, message: 'UID of the target user must be provided.' }, { status: 400 });
    }

    // Set custom claim for role: 'admin'
    await adminAuth.setCustomUserClaims(uid, { role: 'admin' });

    // Update the role in the user's Firestore document as well for consistency
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ role: 'admin' });

    return NextResponse.json({ success: true, message: `Successfully granted admin role to user ${uid}.` });

  } catch (error) {
    console.error("Error granting admin role:", error);
    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ success: false, message: 'The specified user was not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to grant admin role.' }, { status: 500 });
  }
}
