import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // Ensure fresh data

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString()) // Filter for future events
      .order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error in getPublicEvents route:', error);
    return NextResponse.json({ success: false, message: 'Failed to get public events.' }, { status: 500 });
  }
}
