import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 });
    }

    // 1. Check if the email is verified via OTP
    const otpDocRef = adminDb.collection('registrationOtps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists || !otpDoc.data().verified) {
      return NextResponse.json({ error: 'Email not verified. Please verify your email first.' }, { status: 403 });
    }

    // 2. Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
      console.error('Error creating user in Firebase Auth:', error);
      return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
    }

    // 3. Create user document in Firestore
    const userDoc = {
      uid: userRecord.uid,
      email,
      fullName,
      role: 'student', // Default role
      status: 'pending', // Default status, requires admin approval
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userDoc);

    // 4. Clean up the OTP document
    await otpDocRef.delete();

    return NextResponse.json({ success: true, user: { uid: userRecord.uid, email: userRecord.email } });

  } catch (error) {
    console.error('Error in register route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
