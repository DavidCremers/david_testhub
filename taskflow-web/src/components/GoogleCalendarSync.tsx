'use client';

import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Link2, Unlink, Check, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';

interface GoogleCalendarSyncProps {
  onSyncComplete?: () => void;
}

export function GoogleCalendarSync({ onSyncComplete }: GoogleCalendarSyncProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('google_connected')
          .eq('id', user.id)
          .single();

        setIsConnected(profile?.google_connected || false);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const disconnectGoogle = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('profiles')
          .update({
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            google_connected: false,
          })
          .eq('id', user.id);

        setIsConnected(false);
        setSyncStatus({ type: 'success', message: 'Google Calendar losgekoppeld' });
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      setSyncStatus({ type: 'error', message: 'Fout bij loskoppelen' });
    }
  };

  const syncCalendar = async () => {
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus({ type: 'success', message: data.message });
        onSyncComplete?.();
      } else {
        setSyncStatus({ type: 'error', message: data.error || 'Sync mislukt' });
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setSyncStatus({ type: 'error', message: 'Verbindingsfout' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-32 mb-2" />
            <div className="h-3 bg-white/10 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isConnected ? 'bg-green-500/20' : 'bg-white/10'
          }`}>
            <Calendar className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              Google Calendar
              {isConnected && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Verbonden
                </span>
              )}
            </h3>
            <p className="text-gray-400 text-sm">
              {isConnected
                ? 'Synchroniseer je Google Calendar events'
                : 'Koppel je Google Calendar om events te importeren'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={syncCalendar}
                disabled={isSyncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isSyncing ? 'not-allowed' : 'pointer',
                  opacity: isSyncing ? 0.5 : 1,
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchroniseren...' : 'Sync'}
              </button>
              <button
                onClick={disconnectGoogle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Unlink className="w-4 h-4" />
                Loskoppelen
              </button>
            </>
          ) : (
            <button
              onClick={connectGoogle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Link2 className="w-4 h-4" />
              Verbinden
            </button>
          )}
        </div>
      </div>

      {syncStatus && (
        <div className={`mt-4 flex items-center gap-2 text-sm ${
          syncStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
        }`}>
          {syncStatus.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {syncStatus.message}
        </div>
      )}
    </div>
  );
}
