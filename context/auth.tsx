import { isConfigured, supabase, withTimeout } from '@/lib/supabase';
import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type UserRole = 'user' | 'organizer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city: string;
  venue?: string;
  photoUri?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole; isNew: boolean }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole; isNew: boolean }>;
  logout: () => void;
  updateName: (name: string) => void;
  updateCity: (city: string) => void;
  updatePhoto: (uri: string) => void;
  isOrganizer: boolean;
  joinedEventIds: string[];
  joinEvent: (id: string) => void;
  leaveEvent: (id: string) => void;
}

const MOCK_USERS = [
  {
    id: '1',
    name: 'Alex',
    email: 'user@demo.com',
    password: 'demo123',
    role: 'user' as UserRole,
    city: 'Bucharest',
    joinedEventIds: ['ro-2', 'ro-3', 'ro-12'],
  },
  {
    id: '2',
    name: 'The Garden Bar',
    email: 'organizer@demo.com',
    password: 'demo123',
    role: 'organizer' as UserRole,
    city: 'Bucharest',
    venue: 'The Garden Bar',
    joinedEventIds: [] as string[],
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  const userRef = useRef<AuthUser | null>(null);
  const joinedIdsRef = useRef<string[]>([]);
  userRef.current = user;
  joinedIdsRef.current = joinedEventIds;

  useEffect(() => {
    db.getFirstAsync<{ userData: string; joinedEventIds: string }>(
      'SELECT userData, joinedEventIds FROM session WHERE id = 1'
    )
      .then((row) => {
        if (row) {
          setUser(JSON.parse(row.userData) as AuthUser);
          setJoinedEventIds(JSON.parse(row.joinedEventIds) as string[]);
        }
      })
      .catch(console.error)
      .finally(() => setAuthLoading(false));
  }, [db]);

  function saveSession(u: AuthUser, ids: string[]): Promise<void> {
    return db
      .runAsync(
        'INSERT OR REPLACE INTO session (id, userId, userData, joinedEventIds) VALUES (1, ?, ?, ?)',
        [u.id, JSON.stringify(u), JSON.stringify(ids)]
      )
      .then(() => {});
  }

  function clearSession(): Promise<void> {
    return db.runAsync('DELETE FROM session WHERE id = 1').then(() => {});
  }

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole; isNew: boolean }> => {
    if (isConfigured()) {
      try {
        const { data, error } = await withTimeout(
          Promise.resolve(
            supabase.from('users').select('*').eq('email', email.toLowerCase()).maybeSingle()
          )
        );
        if (!error && data) {
          if (data.password !== password) return { success: false, error: 'Invalid email or password', isNew: false };
          const userData: AuthUser = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            city: data.city,
            venue: data.venue ?? undefined,
            photoUri: data.photoUri ?? undefined,
          };
          const ids: string[] = Array.isArray(data.joinedEventIds) ? data.joinedEventIds : [];
          setUser(userData);
          setJoinedEventIds(ids);
          await saveSession(userData, ids);
          return { success: true, role: userData.role, isNew: false };
        }
      } catch (err) {
        console.warn('Supabase login failed, falling back to mock users:', err);
      }
    }

    await new Promise((r) => setTimeout(r, 400));
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password', isNew: false };
    const { password: _p, joinedEventIds: seeded, ...rest } = found;
    const userData = rest as AuthUser;
    setUser(userData);
    setJoinedEventIds(seeded);
    saveSession(userData, seeded).catch(console.error);
    return { success: true, role: found.role, isNew: false };
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole; isNew: boolean }> => {
    if (name.trim().length < 2) return { success: false, error: 'Name must be at least 2 characters.', isNew: false };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.', isNew: false };

    const newUser: AuthUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      city: 'Bucharest',
    };

    if (isConfigured()) {
      try {
        const { data: existing } = await withTimeout(
          Promise.resolve(
            supabase.from('users').select('id').eq('email', newUser.email).maybeSingle()
          )
        );
        if (existing) return { success: false, error: 'An account with this email already exists.', isNew: false };

        const { error } = await withTimeout(
          Promise.resolve(
            supabase.from('users').insert({ ...newUser, password, joinedEventIds: [] })
          )
        );
        if (error) throw error;

        setUser(newUser);
        setJoinedEventIds([]);
        await saveSession(newUser, []);
        return { success: true, role: 'user', isNew: true };
      } catch (err) {
        console.warn('Supabase register failed, falling back to local:', err);
      }
    }

    const exists = MOCK_USERS.find((u) => u.email.toLowerCase() === newUser.email);
    if (exists) return { success: false, error: 'An account with this email already exists.', isNew: false };
    setUser(newUser);
    setJoinedEventIds([]);
    saveSession(newUser, []).catch(console.error);
    return { success: true, role: 'user', isNew: true };
  };

  const logout = () => {
    setUser(null);
    setJoinedEventIds([]);
    clearSession().catch(console.error);
  };

  const updateName = (name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      saveSession(updated, joinedIdsRef.current).catch(console.error);
      if (isConfigured()) {
        supabase
          .from('users')
          .update({ name })
          .eq('id', prev.id)
          .then(({ error }) => { if (error) console.warn('Supabase updateName:', error.message); });
      }
      return updated;
    });
  };

  const updateCity = (city: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, city };
      saveSession(updated, joinedIdsRef.current).catch(console.error);
      if (isConfigured()) {
        supabase
          .from('users')
          .update({ city })
          .eq('id', prev.id)
          .then(({ error }) => { if (error) console.warn('Supabase updateCity:', error.message); });
      }
      return updated;
    });
  };

  const updatePhoto = (uri: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, photoUri: uri };
      saveSession(updated, joinedIdsRef.current).catch(console.error);
      if (isConfigured()) {
        supabase
          .from('users')
          .update({ photoUri: uri })
          .eq('id', prev.id)
          .then(({ error }) => { if (error) console.warn('Supabase updatePhoto:', error.message); });
      }
      return updated;
    });
  };

  const joinEvent = (id: string) => {
    setJoinedEventIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      const u = userRef.current;
      if (u) {
        saveSession(u, next).catch(console.error);
        if (isConfigured()) {
          supabase
            .from('users')
            .update({ joinedEventIds: next })
            .eq('id', u.id)
            .then(({ error }) => { if (error) console.warn('Supabase joinEvent:', error.message); });
        }
      }
      return next;
    });
  };

  const leaveEvent = (id: string) => {
    setJoinedEventIds((prev) => {
      const next = prev.filter((x) => x !== id);
      const u = userRef.current;
      if (u) {
        saveSession(u, next).catch(console.error);
        if (isConfigured()) {
          supabase
            .from('users')
            .update({ joinedEventIds: next })
            .eq('id', u.id)
            .then(({ error }) => { if (error) console.warn('Supabase leaveEvent:', error.message); });
        }
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        login,
        register,
        logout,
        updateName,
        updateCity,
        updatePhoto,
        isOrganizer: user?.role === 'organizer',
        joinedEventIds,
        joinEvent,
        leaveEvent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
