-- Add Google Calendar integration fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT FALSE;

-- Add google_calendar as import source
ALTER TYPE import_source ADD VALUE IF NOT EXISTS 'google_calendar';

-- Add google_event_id to events table for tracking synced events
ALTER TABLE events
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_events_source_reference ON events(source_reference);

-- Update RLS policies to ensure google tokens are only visible to the user
CREATE POLICY "Users can only see their own google tokens"
ON profiles
FOR SELECT
USING (auth.uid() = id);
