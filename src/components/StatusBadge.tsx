import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/theme';

type StatusType = 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
    status: StatusType;
    size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { label: string; bg: string; text: string }> = {
    pending: { label: 'Beklemede', bg: Colors.warningLight, text: '#B8860B' },
    approved: { label: 'Onaylandı', bg: Colors.successLight, text: '#006B4F' },
    rejected: { label: 'Reddedildi', bg: Colors.dangerLight, text: '#C62828' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: config.bg,
                    paddingVertical: size === 'sm' ? 3 : 5,
                    paddingHorizontal: size === 'sm' ? 8 : 12,
                },
            ]}
        >
            <View style={[styles.dot, { backgroundColor: config.text }]} />
            <Text
                style={[
                    styles.text,
                    {
                        color: config.text,
                        fontSize: size === 'sm' ? 11 : 13,
                    },
                ]}
            >
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    text: {
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
