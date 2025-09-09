import { NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import { transporter } from '@/lib/nodemailer';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address must be provided.' }, { status: 400 });
    }

    // Check if user exists before sending OTP
    try {
      await adminAuth.getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ success: false, message: 'No user found with this email address.' }, { status: 404 });
      }
      // For other auth errors, log them and return a generic error
      console.error('Error checking user in send-login-otp:', error);
      return NextResponse.json({ success: false, message: 'Error checking user account.' }, { status: 500 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Use a different collection for login OTPs to keep them separate from registration OTPs
    await db.collection('loginOtps').doc(email).set({
      otp,
      expires: expiration,
    });

    const mailOptions = {
      from: `IEDC Carmel <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Your IEDC Login OTP',
      html: `<p>Your One-Time Password for login is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Login OTP sent successfully.' });

  } catch (error) {
    console.error('Error in send-login-otp route:', error);
    return NextResponse.json({ success: false, message: 'Failed to send login OTP.' }, { status: 500 });
  }
}
