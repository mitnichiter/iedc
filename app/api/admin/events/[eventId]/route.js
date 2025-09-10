import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { verifyAuth } from '@/lib/auth-helper';

// Handler for GET requests to fetch a single event
export async function GET(request, { params }) {
  try {
    const authResult = await verifyAuth(request, { requireAdmin: true });
    if (authResult instanceof NextResponse) return authResult;

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required.' }, { status: 400 });
    }

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    const sanitizedEvent = {
      id: eventDoc.id,
      ...eventData,
      date: eventData.date.toDate().toISOString(),
      createdAt: eventData.createdAt.toDate().toISOString(),
      updatedAt: eventData.updatedAt ? eventData.updatedAt.toDate().toISOString() : null,
    };

    return NextResponse.json(sanitizedEvent);
  } catch (error) {
    console.error("Error getting single event:", error);
    return NextResponse.json({ success: false, message: 'Failed to get event details.' }, { status: 500 });
  }
}

// Handler for PUT requests to update an event
export async function PUT(request, { params }) {
  try {
    const authResult = await verifyAuth(request, { requireAdmin: true });
    if (authResult instanceof NextResponse) return authResult;

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required.' }, { status: 400 });
    }

    const eventData = await request.json();

    // Convert date strings back to Firestore Timestamps if they exist
    if (eventData.date) {
      eventData.date = admin.firestore.Timestamp.fromDate(new Date(eventData.date));
    }
    if (eventData.endDate) {
      eventData.endDate = admin.firestore.Timestamp.fromDate(new Date(eventData.endDate));
    }

    await db.collection('events').doc(eventId).update({
        ...eventData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, message: 'Event updated successfully.' });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ success: false, message: 'Failed to update event.' }, { status: 500 });
  }
}

// Handler for DELETE requests to delete an event
export async function DELETE(request, { params }) {
  try {
    const authResult = await verifyAuth(request, { requireAdmin: true });
    if (authResult instanceof NextResponse) return authResult;

    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ success: false, message: 'Event ID is required.' }, { status: 400 });
    }

    // Note: Deleting an event should ideally also delete all its sub-collections,
    // like 'registrations'. This requires a more complex recursive delete, which can be
    // implemented here if needed. For now, we are just deleting the event document itself.
    // A background Cloud Function is often used for such cascading deletes.
    // Since we are moving away from functions, this logic would need to be handled here explicitly.
    // For now, keeping it simple as per the original function's logic.

    await db.collection('events').doc(eventId).delete();

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ success: false, message: 'Failed to delete event.' }, { status: 500 });
  }
}
