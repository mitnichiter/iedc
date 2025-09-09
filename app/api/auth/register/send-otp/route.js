import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { transporter } from '@/lib/nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'A valid email address must be provided.' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.collection('registrationOtps').doc(email).set({
      otp,
      email,
      expires: expiration,
      verified: false,
    });

    const mailOptions = {
      from: `IEDC Carmel <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email for IEDC Registration',
      html: `<p>Your email verification code is: <strong>${otp}</strong>. This code will expire in 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });

  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json({ success: false, message: 'Failed to send verification email.' }, { status: 500 });
  }
}
