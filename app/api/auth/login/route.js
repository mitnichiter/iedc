import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
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

    const { uid } = decodedToken;
    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required.' }, { status: 400 });
    }

    const otpDocRef = adminDb.collection('loginOtps').doc(uid);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'OTP not found or expired.' }, { status: 404 });
    }

    const { otp: storedOtp, expires } = otpDoc.data();

    if (new Date() > expires.toDate()) {
      await otpDocRef.delete();
      return NextResponse.json({ error: 'OTP has expired.' }, { status: 410 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 403 });
    }

    await otpDocRef.delete();

    return NextResponse.json({ success: true, message: 'Login successful.' });

  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
