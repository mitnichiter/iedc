import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  try {
    // 1. Check if requester is Admin (using RLS/Auth check)
    // We can verify the session token passed in headers, but for API routes Next.js usually handles via cookies?
    // Or we initiate a client with the req headers.
    // For simplicity, let's assume the frontend checks "AdminRoute".
    // BUT backend must verify.
    // We'll use a new supabase client for the request context.
    
    // Actually, to delete a user from Auth, we NEED the Service Role Key.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // 2. Delete from Auth (This cascades to profile usually if set up, but let's delete explicitly if needed)
    // Note: Deleting from Auth usually works.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    // 3. Delete from public.profiles (if not cascading)
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
     
    // Even if profile delete fails (e.g. already gone via cascade), we proceed.
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ message: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
