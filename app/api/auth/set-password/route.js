import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import { verifyAuth } from '@/lib/auth-helper';

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request); // No admin required
    if (authResult instanceof NextResponse) return authResult;
    const { uid } = authResult;

    const { password } = await request.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'A password of at least 6 characters is required.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRef = db.collection('users').doc(uid);
    await userRef.update({ passwordHash: passwordHash });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error in set-password route:', error);
    return NextResponse.json({ success: false, message: 'Failed to update password.' }, { status: 500 });
  }
}
