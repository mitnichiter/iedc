import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const eventsSnapshot = await adminDb.collection('events').where('isPublic', '==', true).orderBy('date', 'desc').get();

    if (eventsSnapshot.empty) {
      return NextResponse.json([]);
    }

    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(events);

  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json({ error: 'Failed to fetch public events.' }, { status: 500 });
  }
}
