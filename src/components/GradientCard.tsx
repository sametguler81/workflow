import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Shadows, Spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface GradientCardProps {
    gradient?: readonly string[];
    children: ReactNode;
    style?: ViewStyle;
    padding?: number;
}

export function GradientCard({ gradient, children, style, padding }: GradientCardProps) {
    const { colors } = useTheme();

    if (gradient) {
        return (
            <LinearGradient
                colors={gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.card,
                    { padding: padding ?? Spacing.xl },
                    style,
                ]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    padding: padding ?? Spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                },
                Shadows.medium,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
});
