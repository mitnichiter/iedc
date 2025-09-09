import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
    }

    const userRef = db.collection('users').doc(userId);

    await userRef.update({
      status: 'approved',
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // TODO: Optionally send a welcome/approval email to the user here.
    // This was a comment in the original code and can be added if needed.

    return NextResponse.json({ success: true, message: `User ${userId} has been approved.` });

  } catch (error) {
    console.error("Error approving user:", error);
    // Firestore's update can fail if the document doesn't exist.
    // A specific check for 'NOT_FOUND' code might be needed depending on the exact error object.
    return NextResponse.json({ success: false, message: 'Failed to approve user. The user may not exist.' }, { status: 500 });
  }
}
