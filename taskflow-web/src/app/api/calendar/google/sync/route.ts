import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchGoogleCalendarEvents, parseGoogleEvent } from '@/lib/google-calendar';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user's Google tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_connected')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_connected || !profile?.google_access_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Fetch events from Google Calendar
    const googleEvents = await fetchGoogleCalendarEvents(
      profile.google_access_token,
      profile.google_refresh_token
    );

    // Parse and prepare events for database
    const eventsToSync = googleEvents.map((event: any) => ({
      ...parseGoogleEvent(event),
      user_id: user.id,
      category: 'personal', // Default category
    }));

    // Upsert events (update if exists, insert if new)
    let synced = 0;
    for (const event of eventsToSync) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_reference', event.source_reference)
        .single();

      if (existing) {
        // Update existing event
        await supabase
          .from('events')
          .update({
            title: event.title,
            description: event.description,
            start_date: event.start_date,
            end_date: event.end_date,
            is_all_day: event.is_all_day,
            location: event.location,
          })
          .eq('id', existing.id);
      } else {
        // Insert new event
        await supabase.from('events').insert(event);
      }
      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `${synced} events gesynchroniseerd`,
      count: synced,
    });
  } catch (error: any) {
    console.error('Error syncing Google Calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
