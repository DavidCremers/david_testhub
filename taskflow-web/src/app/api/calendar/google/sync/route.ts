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
    const errors: string[] = [];
    let synced = 0;

    for (const event of googleEvents) {
      try {
        const parsed = parseGoogleEvent(event);

        // Check if event already exists
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('user_id', user.id)
          .eq('source_reference', parsed.source_reference)
          .single();

        if (existing) {
          // Update existing event
          const { error: updateError } = await supabase
            .from('events')
            .update({
              title: parsed.title,
              description: parsed.description,
              start_date: parsed.start_date,
              end_date: parsed.end_date,
              is_all_day: parsed.is_all_day,
              location: parsed.location,
            })
            .eq('id', existing.id);

          if (updateError) {
            errors.push(`Update error: ${updateError.message}`);
          } else {
            synced++;
          }
        } else {
          // Insert new event
          const { error: insertError } = await supabase
            .from('events')
            .insert({
              user_id: user.id,
              title: parsed.title,
              description: parsed.description,
              start_date: parsed.start_date,
              end_date: parsed.end_date,
              is_all_day: parsed.is_all_day,
              location: parsed.location,
              category: 'personal',
              import_source: 'google_calendar',
              source_reference: parsed.source_reference,
            });

          if (insertError) {
            errors.push(`Insert error: ${insertError.message}`);
          } else {
            synced++;
          }
        }
      } catch (eventError: any) {
        errors.push(`Event parse error: ${eventError.message}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `${synced} events gesynchroniseerd, ${errors.length} fouten`,
        errors: errors.slice(0, 5), // Return first 5 errors
        count: synced,
      });
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
