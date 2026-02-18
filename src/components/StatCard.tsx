import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Shadows, Spacing, Colors } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    gradient?: readonly string[];
    subtitle?: string;
}

export function StatCard({ title, value, icon, gradient, subtitle }: StatCardProps) {
    const { colors } = useTheme();

    if (gradient) {
        return (
            <LinearGradient
                colors={gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, Shadows.medium]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.valueLight}>{value}</Text>
                <Text style={styles.titleLight}>{title}</Text>
                {subtitle && <Text style={styles.subtitleLight}>{subtitle}</Text>}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                },
                Shadows.small,
            ]}
        >
            <View style={[styles.iconContainerPlain, { backgroundColor: Colors.primaryLight + '20' }]}>
                <Ionicons name={icon} size={22} color={Colors.primary} />
            </View>
            <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        minWidth: 140,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    iconContainerPlain: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    value: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    valueLight: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    titleLight: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    subtitleLight: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
});
