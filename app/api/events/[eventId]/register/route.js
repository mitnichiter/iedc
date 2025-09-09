import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req, { params }) {
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

        const { uid, email, name } = decodedToken;
        const { eventId } = params;
        const registrationData = await req.json();

        const eventRef = adminDb.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
        }

        const registrationRef = eventRef.collection('registrations').doc(uid);
        const registrationDoc = await registrationRef.get();

        if (registrationDoc.exists) {
            return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 409 });
        }

        const newRegistration = {
            ...registrationData,
            userId: uid,
            userEmail: email,
            userName: name || '',
            status: 'registered', // 'registered', 'verified'
            registeredAt: new Date().toISOString(),
        };

        await registrationRef.set(newRegistration);

        return NextResponse.json({ success: true, message: 'Successfully registered for the event.' }, { status: 201 });

    } catch (error) {
        console.error('Error registering for event:', error);
        return NextResponse.json({ error: 'Failed to register for the event.' }, { status: 500 });
    }
}
