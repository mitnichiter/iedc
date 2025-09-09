import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req, { params }) {
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

        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { eventId } = params;
        const registrationsSnapshot = await adminDb.collection('events').doc(eventId).collection('registrations').get();

        if (registrationsSnapshot.empty) {
            return NextResponse.json([]);
        }

        const registrations = registrationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json(registrations);

    } catch (error) {
        console.error('Error fetching event registrations:', error);
        return NextResponse.json({ error: 'Failed to fetch event registrations.' }, { status: 500 });
    }
}
