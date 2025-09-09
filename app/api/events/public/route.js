import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function GET() {
  try {
    const now = admin.firestore.Timestamp.now();

    const eventsSnapshot = await db.collection('events')
      .where('date', '>=', now)
      .orderBy('date', 'asc')
      .get();

    const events = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to ISO strings for JSON serialization
            date: data.date.toDate().toISOString(),
            endDate: data.endDate ? data.endDate.toDate().toISOString() : null,
            createdAt: data.createdAt.toDate().toISOString(),
        };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error in getPublicEvents route:', error);
    return NextResponse.json({ success: false, message: 'Failed to get public events.' }, { status: 500 });
  }
}
