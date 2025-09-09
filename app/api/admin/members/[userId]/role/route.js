import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ success: false, message: 'User ID and new role must be provided.' }, { status: 400 });
    }

    const validRoles = ['student', 'admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ success: false, message: 'Invalid role specified.' }, { status: 400 });
    }

    // 1. Set Custom Claim in Firebase Auth
    await adminAuth.setCustomUserClaims(userId, { role: newRole });

    // 2. Update role in Firestore Document for consistency
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.update({ role: newRole });

    return NextResponse.json({ success: true, message: `User ${userId} role updated to ${newRole}.` });

  } catch (error) {
    console.error("Error setting user role:", error);
    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ success: false, message: 'The specified user was not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to set user role.' }, { status: 500 });
  }
}
