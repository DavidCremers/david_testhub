import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export function getGoogleAuthUrl() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export function getOAuth2Client(tokens?: { access_token: string; refresh_token?: string }) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  if (tokens) {
    oauth2Client.setCredentials(tokens);
  }

  return oauth2Client;
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  refreshToken?: string,
  timeMin?: Date,
  timeMax?: Date
) {
  const oauth2Client = getOAuth2Client({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const defaultTimeMin = timeMin || now;
  const defaultTimeMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: defaultTimeMin.toISOString(),
      timeMax: defaultTimeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });

    return response.data.items || [];
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error);
    throw new Error(error.message || 'Failed to fetch calendar events');
  }
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string | undefined,
  event: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    isAllDay?: boolean;
  }
) {
  const oauth2Client = getOAuth2Client({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const eventData: any = {
    summary: event.title,
    description: event.description,
    location: event.location,
  };

  if (event.isAllDay) {
    eventData.start = { date: event.startDate.toISOString().split('T')[0] };
    eventData.end = { date: event.endDate.toISOString().split('T')[0] };
  } else {
    eventData.start = { dateTime: event.startDate.toISOString() };
    eventData.end = { dateTime: event.endDate.toISOString() };
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    throw new Error(error.message || 'Failed to create calendar event');
  }
}

export function parseGoogleEvent(googleEvent: any) {
  const start = googleEvent.start?.dateTime || googleEvent.start?.date;
  const end = googleEvent.end?.dateTime || googleEvent.end?.date;
  const isAllDay = !googleEvent.start?.dateTime;

  return {
    google_event_id: googleEvent.id,
    title: googleEvent.summary || 'Geen titel',
    description: googleEvent.description || '',
    start_date: new Date(start).toISOString(),
    end_date: new Date(end).toISOString(),
    is_all_day: isAllDay,
    location: googleEvent.location || null,
    import_source: 'google_calendar' as const,
    source_reference: googleEvent.htmlLink,
  };
}
