import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl = rawUrl && !rawUrl.includes('://') 
  ? `https://${rawUrl}.supabase.co` 
  : rawUrl;

const isConfigured = 
  supabaseUrl && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
  supabaseAnonKey;

function getSupabase() {
  if (!isConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const { action, query, guestId } = await req.json();

    if (action === 'search') {
      if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      // Try searching by code or name
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`code.ilike.%${query}%,name.ilike.%${query}%`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } 
    
    if (action === 'confirm') {
      if (!guestId) {
        return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 });
      }

      const parts = String(guestId).split('-');
      const groupPrefix = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : String(guestId);

      // Query the specific members in the same family group to avoid wrong matches
      const { data: familyMembers, error: fetchError } = await supabase
        .from('guests')
        .select('id')
        .or(`id.eq.${groupPrefix},id.like.${groupPrefix}-%`);

      if (fetchError || !familyMembers || familyMembers.length === 0) {
        // Fallback: If group fetch fails, just update the single guestId directly to be robust
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('guests')
          .update({
            is_confirmed: true,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', guestId)
          .select();

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, updated: fallbackData });
      }

      const idsToUpdate = familyMembers.map((m: any) => m.id);

      // Perform update using perfectly compatible .in() filter
      const { data, error } = await supabase
        .from('guests')
        .update({
          is_confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .in('id', idsToUpdate)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
