import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-helper';

export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuth(request, { requireAdmin: true });
    if (authResult instanceof NextResponse) return authResult;

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required.' }, { status: 400 });
    }

    const registrationsSnapshot = await db
        .collection('events').doc(eventId)
        .collection('registrations').orderBy('registeredAt', 'desc').get();

    const registrations = registrationsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Timestamp to ISO string
            registeredAt: data.registeredAt.toDate().toISOString(),
        }
    });

    return NextResponse.json(registrations);

  } catch (error) {
    console.error("Error getting event registrations:", error);
    return NextResponse.json({ success: false, message: 'Failed to get registrations.' }, { status: 500 });
  }
}
