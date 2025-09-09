import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email and OTP must be provided.' }, { status: 400 });
    }

    const otpDocRef = db.collection('registrationOtps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ success: false, message: 'OTP not found. It may have expired.' }, { status: 404 });
    }

    const { otp: storedOtp, expires, verified } = otpDoc.data();

    if (verified) {
      return NextResponse.json({ success: true, message: 'Email already verified.' });
    }

    if (new Date() > expires.toDate()) {
      await otpDocRef.delete();
      return NextResponse.json({ success: false, message: 'OTP has expired. Please request a new one.' }, { status: 410 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP provided.' }, { status: 400 });
    }

    await otpDocRef.update({ verified: true });

    return NextResponse.json({ success: true, message: 'OTP verified successfully.' });

  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json({ success: false, message: 'Failed to verify OTP.' }, { status: 500 });
  }
}
