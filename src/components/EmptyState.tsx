import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <View style={[styles.iconBg, { backgroundColor: colors.surfaceVariant }]}>
                <Ionicons name={icon} size={48} color={colors.textTertiary} />
            </View>
            <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textTertiary }]}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxxl,
    },
    iconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
