import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getTokensFromCode } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = request.nextUrl.origin;

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/?error=google_auth_failed', baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', baseUrl));
  }

  try {
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get current user from Supabase
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/?error=not_authenticated', baseUrl));
    }

    // Store tokens in user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        google_connected: true,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error storing Google tokens:', updateError);
      return NextResponse.redirect(new URL('/?error=token_storage_failed', baseUrl));
    }

    return NextResponse.redirect(new URL('/?success=google_connected', baseUrl));
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/?error=google_auth_failed', baseUrl));
  }
}
