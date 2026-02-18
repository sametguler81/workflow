import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../context/OfflineContext';

export function OfflineBanner() {
    const { isOffline } = useOffline();
    const [showReconnected, setShowReconnected] = useState(false);
    const [hasBeenOffline, setHasBeenOffline] = useState(false);
    const translateY = useRef(new Animated.Value(-60)).current;

    useEffect(() => {
        if (isOffline) {
            setHasBeenOffline(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        } else if (hasBeenOffline) {
            // Show "reconnected" briefly
            setShowReconnected(true);
            setTimeout(() => {
                Animated.timing(translateY, {
                    toValue: -60,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setShowReconnected(false);
                    setHasBeenOffline(false);
                });
            }, 2500);
        } else {
            translateY.setValue(-60);
        }
    }, [isOffline]);

    if (!isOffline && !showReconnected) return null;

    return (
        <Animated.View
            style={[
                styles.banner,
                {
                    backgroundColor: isOffline ? '#DC2626' : '#059669',
                    transform: [{ translateY }],
                },
            ]}
        >
            <Ionicons
                name={isOffline ? 'cloud-offline-outline' : 'checkmark-circle-outline'}
                size={16}
                color="#FFF"
            />
            <Text style={styles.text}>
                {isOffline
                    ? 'Çevrimdışı — veriler bağlantı gelince senkronize edilecek'
                    : 'Bağlantı sağlandı ✓'}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
        paddingBottom: 8,
        paddingHorizontal: 16,
        gap: 6,
    },
    text: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
});
