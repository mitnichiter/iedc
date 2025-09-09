import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { transporter } from '@/lib/nodemailer';

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

    const { uid, email } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: 'Email not found in user token.' }, { status: 500 });
    }

    // Check if user is approved
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().status !== 'approved') {
        return NextResponse.json({ error: 'User account is not approved or does not exist.' }, { status: 403 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await adminDb.collection('loginOtps').doc(uid).set({
      otp,
      email,
      expires: expiration,
    });

    const mailOptions = {
      from: `IEDC Carmel <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Your IEDC Login Verification Code',
      html: `<p>Your verification code is: <strong>${otp}</strong>. This code will expire in 10 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Login verification code sent to your email.' });

  } catch (error) {
    console.error('Error in send-login-otp route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
