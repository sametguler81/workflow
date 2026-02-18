import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface OfflineContextType {
    isOffline: boolean;
    wasOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType>({
    isOffline: false,
    wasOffline: false,
});

export function useOffline() {
    return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const offline = !(state.isConnected && state.isInternetReachable !== false);

            if (offline && !isOffline) {
                setWasOffline(true);
            }

            setIsOffline(offline);
        });

        return () => unsubscribe();
    }, [isOffline]);

    return (
        <OfflineContext.Provider value={{ isOffline, wasOffline }}>
            {children}
        </OfflineContext.Provider>
    );
}
