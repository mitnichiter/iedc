import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-helper';

export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAuth(request, { requireAdmin: true });
    if (authResult instanceof NextResponse) return authResult;

    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required.' }, { status: 400 });
    }

    // As a safeguard, prevent a user from deleting themselves via this API.
    if (authResult.uid === userId) {
        return NextResponse.json({ success: false, message: 'Admins cannot delete their own account through this function.' }, { status: 403 });
    }

    // 1. Delete Firebase Auth User
    await adminAuth.deleteUser(userId);

    // 2. Delete Firestore User Document
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.delete();

    // TODO: Consider deleting other user-associated data (e.g., registrations).
    // This would require more complex logic to find and delete all related documents.

    return NextResponse.json({ success: true, message: `User ${userId} and their data have been deleted.` });

  } catch (error) {
    console.error("Error deleting user account:", error);
    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ success: false, message: 'The specified user to delete was not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to delete user account.' }, { status: 500 });
  }
}
