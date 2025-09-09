import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP must be provided.' }, { status: 400 });
    }

    const otpDocRef = adminDb.collection('registrationOtps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'OTP not found for this email. It may have expired or never been sent.' }, { status: 404 });
    }

    const { otp: storedOtp, expires, verified } = otpDoc.data();

    if (verified) {
      return NextResponse.json({ success: true, message: 'Email already verified.' });
    }

    if (new Date() > expires.toDate()) {
      await otpDocRef.delete();
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 410 });
    }

    if (storedOtp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP provided.' }, { status: 403 });
    }

    await otpDocRef.update({ verified: true });

    return NextResponse.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
