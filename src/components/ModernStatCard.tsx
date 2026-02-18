import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';

interface ModernStatCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string; // Icon and highlight color
    trend?: string; // Optional trend text (e.g. "+5%")
    trendUp?: boolean; // True if positive trend
    style?: ViewStyle;
}

export function ModernStatCard({
    title,
    value,
    icon,
    color = Colors.primary,
    trend,
    trendUp,
    style,
}: ModernStatCardProps) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                },
                style,
            ]}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                {trend && (
                    <View style={[styles.trendBadge, { backgroundColor: trendUp ? Colors.successLight : Colors.dangerLight }]}>
                        <Ionicons
                            name={trendUp ? 'arrow-up' : 'arrow-down'}
                            size={12}
                            color={trendUp ? Colors.success : Colors.danger}
                        />
                        <Text style={[styles.trendText, { color: trendUp ? Colors.success : Colors.danger }]}>
                            {trend}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
                <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
        minHeight: 110,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        gap: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 13,
        fontWeight: '500',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 100,
        gap: 2,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
