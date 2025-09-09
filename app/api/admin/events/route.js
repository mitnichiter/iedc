import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req) {
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

    const eventsSnapshot = await adminDb.collection('events').orderBy('date', 'desc').get();

    if (eventsSnapshot.empty) {
      return NextResponse.json([]);
    }

    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(events);

  } catch (error) {
    console.error('Error fetching events for admin:', error);
    return NextResponse.json({ error: 'Failed to fetch events.' }, { status: 500 });
  }
}

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

        if (decodedToken.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const eventData = await req.json();

        // Basic validation
        if (!eventData.name || !eventData.date || !eventData.description) {
            return NextResponse.json({ error: 'Missing required event fields.' }, { status: 400 });
        }

        const newEvent = {
            ...eventData,
            createdAt: new Date().toISOString(),
        };

        const eventRef = await adminDb.collection('events').add(newEvent);

        return NextResponse.json({ id: eventRef.id, ...newEvent }, { status: 201 });

    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 });
    }
}
