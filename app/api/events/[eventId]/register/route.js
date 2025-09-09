import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(request, { params }) {
  try {
    const { eventId } = params;
    const { registrationData, screenshotUrl } = await request.json();

    if (!eventId || !registrationData || !screenshotUrl) {
      return NextResponse.json({ success: false, message: 'Event ID, registration data, and screenshot are required.' }, { status: 400 });
    }

    // This route can be called by authenticated or anonymous users.
    // We'll check for an auth token, but won't require it.
    let userId = null;
    let registrationId;

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        const token = authHeader.split('Bearer ')[1];
        try {
            // We're not using the middleware here, so we verify the token manually if it exists.
            const decodedToken = await admin.auth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (e) {
            // Invalid token provided, treat as anonymous.
            console.warn("Invalid token provided for event registration, treating as anonymous.", e.message);
        }
    }

    // Use the authenticated user's ID or the provided email for the registration document ID.
    registrationId = userId ? userId : registrationData.email;

    if(!registrationId) {
      return NextResponse.json({ success: false, message: 'Email is required for anonymous registration.' }, { status: 400 });
    }

    const eventRef = db.collection('events').doc(eventId);
    const registrationRef = eventRef.collection('registrations').doc(registrationId);

    // Use a transaction to ensure atomicity of registration and count increment
    await db.runTransaction(async (transaction) => {
      transaction.set(registrationRef, {
        ...registrationData,
        userId: userId, // Can be null for anonymous
        screenshotUrl: screenshotUrl,
        status: 'pending',
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment the registration count on the event
      transaction.update(eventRef, {
        registrationCount: admin.firestore.FieldValue.increment(1)
      });
    });

    return NextResponse.json({ success: true, message: 'Registration submitted successfully. Awaiting verification.' });

  } catch (error) {
    console.error("Error in event registration route:", error);
    return NextResponse.json({ success: false, message: 'Failed to submit registration.' }, { status: 500 });
  }
}
