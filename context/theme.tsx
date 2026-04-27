import React, { createContext, useContext, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemePreference = 'light' | 'system' | 'dark';

interface ThemeContextType {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    Appearance.setColorScheme(p === 'system' ? null : p);
  };

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemeProvider');
  return ctx;
}
