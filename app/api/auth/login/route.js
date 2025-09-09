import { NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, otp } = await request.json();

    if (!email || !password || !otp) {
      return NextResponse.json({ success: false, message: 'Email, password, and OTP are required.' }, { status: 400 });
    }

    // 1. Verify OTP
    const otpDocRef = db.collection('loginOtps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ success: false, message: 'OTP not found or expired. Please request a new one.' }, { status: 404 });
    }

    const { otp: storedOtp, expires } = otpDoc.data();

    if (new Date() > expires.toDate()) {
      await otpDocRef.delete();
      return NextResponse.json({ success: false, message: 'OTP expired. Please request a new one.' }, { status: 410 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP.' }, { status: 403 });
    }

    // 2. Verify user and password
    const userRecord = await adminAuth.getUserByEmail(email);
    const userDoc = await db.collection('users').doc(userRecord.uid).get();

    if (!userDoc.exists || !userDoc.data().passwordHash) {
      // This case handles users that might exist in Auth but not in Firestore, or have no password set.
      return NextResponse.json({ success: false, message: 'Password not set for this user. Please use "Forgot Password" to set it.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, userDoc.data().passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect password.' }, { status: 401 });
    }

    // 3. Create a custom token for the client to sign in
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    // 4. Clean up the used OTP
    await otpDocRef.delete();

    return NextResponse.json({ success: true, token: customToken });

  } catch (error) {
    console.error('Error in login route:', error);
    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ success: false, message: 'No user account exists for this email.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to log in.' }, { status: 500 });
  }
}
