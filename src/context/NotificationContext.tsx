import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUnreadCount } from '../services/announcementService';

interface NotificationContextData {
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextData>({
    unreadCount: 0,
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!profile) {
            setUnreadCount(0);
            return;
        }

        const unsubscribe = subscribeToUnreadCount(
            profile.companyId,
            profile.uid,
            profile.role,
            (count) => setUnreadCount(count)
        );

        return () => unsubscribe();
    }, [profile]);

    return (
        <NotificationContext.Provider value={{ unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
