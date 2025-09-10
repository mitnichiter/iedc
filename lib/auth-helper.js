import { adminAuth } from './firebase-admin';
import { NextResponse } from 'next/server';

/**
 * Verifies the authentication token from the request headers.
 * @param {Request} request The incoming request object.
 * @param {{
 *   requireAdmin: boolean;
 * }} options An object to specify verification options.
 * @returns {Promise<object|NextResponse>} The decoded token if successful, or a NextResponse object if authentication fails.
 */
export async function verifyAuth(request, options = { requireAdmin: false }) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    return NextResponse.json({ success: false, message: 'Authentication required: No token provided.' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (options.requireAdmin && decodedToken.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Permission denied: Requires admin role.' }, { status: 403 });
    }

    return decodedToken; // Success

  } catch (error) {
    console.error('Error verifying auth token in helper:', error);
    let message = 'Authentication failed: Invalid token.';
    if (error.code === 'auth/id-token-expired') {
      message = 'Authentication failed: Token has expired.';
    }
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
