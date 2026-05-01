import {
  CREATE_TABLE,
  INSERT_EVENT,
  SEED,
  eventToRow,
  rowToEvent,
  type DbEventRow,
  type OrganizerEvent,
} from '@/lib/database';
import { isConfigured, supabase, withTimeout } from '@/lib/supabase';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type { EventCategory, EventStatus, OrganizerEvent, PriceKey } from '@/lib/database';

export const PRICE_OPTIONS: { key: import('@/lib/database').PriceKey; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: '5-10', label: '€5-10' },
  { key: '10-20', label: '€10-20' },
  { key: '20-50', label: '€20-50' },
  { key: '50+', label: '€50+' },
];

export const CATEGORIES: import('@/lib/database').EventCategory[] = [
  'Trips', 'Games', 'Sports', 'Social', 'Reading', 'Music', 'Culture', 'Online',
];

export const CATEGORY_EMOJI: Record<import('@/lib/database').EventCategory, string> = {
  Trips: '🗺️',
  Games: '♟️',
  Sports: '🏓',
  Social: '🤝',
  Reading: '📚',
  Music: '🎶',
  Culture: '🎨',
  Online: '💻',
};

export const DEMO_NOW = new Date(2026, 3, 28);

const MONTH_MAP: Record<string, number> = {
  'Ian': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mai': 4, 'Iun': 5,
  'Iul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Noi': 10, 'Dec': 11,
};

export function isEventPast(date: string, time: string): boolean {
  const isRange = date.includes(' - ');
  const segments = date.split(' - ');
  const lastSegment = segments[segments.length - 1].trim();
  const match = lastSegment.match(/(\d+)\s+([A-Za-z]+)/);
  if (!match) return false;
  const day = parseInt(match[1]);
  const month = MONTH_MAP[match[2]];
  if (month === undefined) return false;
  const year = DEMO_NOW.getFullYear();
  let hours = 23, minutes = 59;
  if (!isRange) {
    const t = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (t) {
      hours = parseInt(t[1]);
      minutes = parseInt(t[2]);
      if (t[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (t[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
      hours += 2;
    }
  }
  return new Date(year, month, day, hours, minutes) < DEMO_NOW;
}

interface EventsContextType {
  events: OrganizerEvent[];
  loading: boolean;
  cloudConnected: boolean;
  addEvent: (event: Omit<OrganizerEvent, 'id'>) => string;
  updateEvent: (id: string, updates: Partial<OrganizerEvent>) => void;
  deleteEvent: (id: string) => void;
  getEvent: (id: string) => OrganizerEvent | undefined;
}

const EventsContext = createContext<EventsContextType | null>(null);

// Supabase stores photos as a native JSON array — no JSON.stringify needed
type SupabaseRow = Omit<OrganizerEvent, 'photos'> & { photos: string[] };

function fromSupabase(row: SupabaseRow): OrganizerEvent {
  return { ...row, photos: Array.isArray(row.photos) ? row.photos : [] };
}

async function trySupabaseFetch(): Promise<OrganizerEvent[]> {
  const { data, error } = await withTimeout(
    Promise.resolve(supabase.from('events').select('*').order('id', { ascending: false }))
  );
  if (error) throw error;
  const rows = data as SupabaseRow[];

  if (rows.length === 0) {
    supabase.from('events').insert(SEED).then(({ error: e }) => {
      if (e) console.warn('Supabase seed failed:', e.message);
    });
    return SEED;
  }

  const existingIds = new Set(rows.map((r) => r.id));
  const missing = SEED.filter((s) => !existingIds.has(s.id));
  if (missing.length > 0) {
    supabase.from('events').insert(missing).then(({ error: e }) => {
      if (e) console.warn('Supabase missing seeds insert failed:', e.message);
    });
    return [...missing, ...rows.map(fromSupabase)];
  }

  return rows.map(fromSupabase);
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloudConnected, setCloudConnected] = useState(false);

  useEffect(() => {
    async function load() {
      if (isConfigured()) {
        try {
          const cloudEvents = await trySupabaseFetch();
          setEvents(cloudEvents);
          setCloudConnected(true);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('Supabase unavailable, falling back to local database:', err);
        }
      }

      try {
        const rows = await db.getAllAsync<DbEventRow>('SELECT * FROM events ORDER BY rowid DESC');
        const existingIds = new Set(rows.map((r) => r.id));
        const missing = SEED.filter((s) => !existingIds.has(s.id));
        if (missing.length > 0) {
          await db.withTransactionAsync(async () => {
            for (const event of missing) {
              await db.runAsync(INSERT_EVENT, eventToRow(event));
            }
          });
          setEvents([...missing, ...rows.map(rowToEvent)]);
        } else {
          setEvents(rows.map(rowToEvent));
        }
      } catch (err) {
        console.error('SQLite load failed:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [db]);

  const addEvent = useCallback((event: Omit<OrganizerEvent, 'id'>): string => {
    const id = Date.now().toString();
    const full: OrganizerEvent = { ...event, id };

    setEvents((prev) => [full, ...prev]);

    db.runAsync(INSERT_EVENT, eventToRow(full)).catch(console.error);

    if (isConfigured()) {
      supabase.from('events').insert(full).then(({ error }) => {
        if (error) console.warn('Supabase insert failed:', error.message);
      });
    }

    return id;
  }, [db]);

  const updateEvent = useCallback((id: string, updates: Partial<OrganizerEvent>): void => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...updates };

        const keys = Object.keys(updates) as (keyof OrganizerEvent)[];
        const setClauses = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) =>
          k === 'photos' ? JSON.stringify(updated.photos) : (updated[k] as string | number | null)
        );
        db.runAsync(`UPDATE events SET ${setClauses} WHERE id = ?`, [...values, id]).catch(console.error);

        if (isConfigured()) {
          supabase.from('events').update(updates).eq('id', id).then(({ error }) => {
            if (error) console.warn('Supabase update failed:', error.message);
          });
        }

        return updated;
      })
    );
  }, [db]);

  const deleteEvent = useCallback((id: string): void => {
    setEvents((prev) => prev.filter((e) => e.id !== id));

    db.runAsync('DELETE FROM events WHERE id = ?', [id]).catch(console.error);

    if (isConfigured()) {
      supabase.from('events').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase delete failed:', error.message);
      });
    }
  }, [db]);

  const getEvent = useCallback(
    (id: string) => events.find((e) => e.id === id),
    [events]
  );

  return (
    <EventsContext.Provider value={{ events, loading, cloudConnected, addEvent, updateEvent, deleteEvent, getEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
