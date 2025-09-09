import { NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { email, password, userData } = await request.json();

    if (!email || !password || !userData) {
      return NextResponse.json({ success: false, message: 'Email, password, and user data are required.' }, { status: 400 });
    }

    // Security Check: Verify that the email was OTP-verified
    const otpDocRef = db.collection('registrationOtps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists || !otpDoc.data().verified) {
        return NextResponse.json({ success: false, message: 'Email not verified. Please complete the OTP step first.' }, { status: 403 });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: userData.fullName,
      disabled: false, // User is enabled by default
    });

    // 2. Set custom claim for role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'student' });

    // 3. Save user data to Firestore
    const userDocData = {
      ...userData,
      uid: userRecord.uid,
      role: 'student',
      status: 'pending', // Initial status, awaiting admin approval
      createdAt: new Date().toISOString(),
    };
    await db.collection('users').doc(userRecord.uid).set(userDocData);

    // 4. Clean up the OTP document
    await otpDocRef.delete();

    return NextResponse.json({ success: true, message: 'User registered successfully. Account is pending approval.' });

  } catch (error) {
    console.error('Error in register route:', error);
    // Provide more specific error messages if possible
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Failed to register user.' }, { status: 500 });
  }
}
