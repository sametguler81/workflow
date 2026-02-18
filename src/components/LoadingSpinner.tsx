import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors, Spacing } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'large';
}

export function LoadingSpinner({ message, size = 'large' }: LoadingSpinnerProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ActivityIndicator size={size} color={Colors.primary} />
            {message && (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: Spacing.lg,
        fontSize: 14,
        fontWeight: '500',
    },
});
