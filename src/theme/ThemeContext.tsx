import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { LightTheme, DarkTheme } from './theme';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeColors = typeof LightTheme | typeof DarkTheme;

interface ThemeContextType {
    colors: ThemeColors;
    isDark: boolean;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('system');

    const isDark = useMemo(() => {
        if (mode === 'system') return systemScheme === 'dark';
        return mode === 'dark';
    }, [mode, systemScheme]);

    const colors = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

    const value = useMemo(
        () => ({ colors, isDark, mode, setMode }),
        [colors, isDark, mode]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
