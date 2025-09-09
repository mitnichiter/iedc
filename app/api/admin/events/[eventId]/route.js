import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function verifyAdmin(req) {
    const authorization = req.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return { error: 'Unauthorized', status: 401 };
    }
    const idToken = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.role !== 'admin') {
            return { error: 'Forbidden', status: 403 };
        }
        return { decodedToken };
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return { error: 'Unauthorized', status: 401 };
    }
}

export async function GET(req, { params }) {
    const { error, status } = await verifyAdmin(req);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const { eventId } = params;
        const eventDoc = await adminDb.collection('events').doc(eventId).get();

        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
        }

        return NextResponse.json({ id: eventDoc.id, ...eventDoc.data() });
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json({ error: 'Failed to fetch event.' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    const { error, status } = await verifyAdmin(req);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const { eventId } = params;
        const eventData = await req.json();

        await adminDb.collection('events').doc(eventId).update(eventData);

        return NextResponse.json({ success: true, message: `Event ${eventId} updated successfully.` });
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event.' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { error, status } = await verifyAdmin(req);
    if (error) return NextResponse.json({ error }, { status });

    try {
        const { eventId } = params;

        // TODO: Also delete registrations associated with this event.

        await adminDb.collection('events').doc(eventId).delete();

        return NextResponse.json({ success: true, message: `Event ${eventId} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event.' }, { status: 500 });
    }
}
