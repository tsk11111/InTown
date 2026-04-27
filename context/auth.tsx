import React, { createContext, useContext, useState } from 'react';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateName: (name: string) => void;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 600));
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password' };
    const { password: _p, joinedEventIds: seeded, ...userData } = found;
    setUser(userData);
    setJoinedEventIds(seeded);
    return { success: true };
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 600));
    const exists = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, error: 'An account with this email already exists.' };
    if (name.trim().length < 2) return { success: false, error: 'Name must be at least 2 characters.' };
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    const newUser: AuthUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      city: 'Bucharest',
    };
    setUser(newUser);
    setJoinedEventIds([]);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setJoinedEventIds([]);
  };

  const updateName = (name: string) => {
    setUser((prev) => (prev ? { ...prev, name } : prev));
  };

  const updatePhoto = (uri: string) => {
    setUser((prev) => (prev ? { ...prev, photoUri: uri } : prev));
  };

  const joinEvent = (id: string) =>
    setJoinedEventIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const leaveEvent = (id: string) =>
    setJoinedEventIds((prev) => prev.filter((x) => x !== id));

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateName,
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
