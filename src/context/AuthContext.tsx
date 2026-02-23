import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
    onAuthChange,
    getUserProfile,
    UserProfile,
} from '../services/authService';
import { registerForPushNotificationsAsync, saveUserPushToken } from '../services/notificationService';

type User = FirebaseAuthTypes.User;

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    setProfile: (profile: UserProfile | null) => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const p = await getUserProfile(firebaseUser.uid);
                    setProfile(p);

                    // Register for push notifications and save token
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                        await saveUserPushToken(firebaseUser.uid, token);
                    }
                } catch (err) {
                    console.error('Failed to load profile:', err);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const refreshProfile = async () => {
        if (user) {
            const p = await getUserProfile(user.uid);
            setProfile(p);
        }
    };

    const value = useMemo(
        () => ({ user, profile, loading, setProfile, refreshProfile }),
        [user, profile, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
