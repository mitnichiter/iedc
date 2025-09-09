import { NextResponse } from 'next/server';
import { adminAuth } from './lib/firebase-admin';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Extract the token from the Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split('Bearer ')[1];

  // For all protected routes, a token is required.
  if (!token) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication required: No token provided.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    // Verify the token using the Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);

    // If the route is an admin route, check for the 'admin' role
    if (pathname.startsWith('/api/admin')) {
      if (decodedToken.role !== 'admin') {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Permission denied: Requires admin role.' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Add the decoded token to the request headers so it can be accessed in the API route
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-decoded-token', JSON.stringify(decodedToken));

    // Continue to the requested route
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Error verifying auth token:', error);
    let message = 'Authentication failed: Invalid token.';
    if (error.code === 'auth/id-token-expired') {
        message = 'Authentication failed: Token has expired.';
    }
    return new NextResponse(
      JSON.stringify({ success: false, message }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
}

// Define the paths that the middleware should apply to
export const config = {
  matcher: [
    /*
     * Match all admin API routes
     */
    '/api/admin/:path*',
    /*
     * Match other specific protected routes that require authentication
     * but not necessarily admin role.
     */
    '/api/auth/set-password',
    // Add other protected user routes here as they are created
  ],
};
