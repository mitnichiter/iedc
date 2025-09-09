import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { transporter } from '@/lib/nodemailer';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address must be provided.' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      await adminDb.collection('registrationOtps').doc(email).set({
        otp,
        email,
        expires: expiration,
        verified: false,
      });
    } catch (error) {
      console.error('Firestore write error (registrationOtps):', error);
      return NextResponse.json({ error: 'Failed to save OTP for registration.' }, { status: 500 });
    }

    const mailOptions = {
      from: `IEDC Carmel <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email for IEDC Registration',
      html: `<p>Your email verification code is: <strong>${otp}</strong>. This code will expire in 10 minutes.</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });
    } catch (error) {
      console.error('Nodemailer transport error (registration):', error);
      return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
