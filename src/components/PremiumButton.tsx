import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function PremiumButton({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
}: PremiumButtonProps) {
    const { colors } = useTheme();
    const isDisabled = disabled || loading;

    const sizeStyles = {
        sm: { paddingVertical: 10, paddingHorizontal: 16 },
        md: { paddingVertical: 14, paddingHorizontal: 24 },
        lg: { paddingVertical: 18, paddingHorizontal: 32 },
    };

    const textSizes = {
        sm: { fontSize: 13 },
        md: { fontSize: 15 },
        lg: { fontSize: 17 },
    };

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.85}
                style={[{ opacity: isDisabled ? 0.5 : 1 }, style]}
            >
                <LinearGradient
                    colors={Colors.gradientPrimary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.button,
                        sizeStyles[size],
                        Shadows.glow(Colors.primary),
                        { borderRadius: BorderRadius.lg },
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            {icon}
                            <Text style={[styles.buttonText, textSizes[size], textStyle]}>
                                {title}
                            </Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variantStyles: Record<string, { bg: string; text: string; border?: string }> = {
        secondary: { bg: colors.surfaceVariant, text: Colors.primary },
        outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
        ghost: { bg: 'transparent', text: Colors.primary },
        danger: { bg: Colors.danger, text: '#FFF' },
    };

    const v = variantStyles[variant] || variantStyles.secondary;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
            style={[
                styles.button,
                sizeStyles[size],
                {
                    backgroundColor: v.bg,
                    borderRadius: BorderRadius.lg,
                    borderWidth: v.border ? 1.5 : 0,
                    borderColor: v.border,
                    opacity: isDisabled ? 0.5 : 1,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={v.text} size="small" />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.buttonText, textSizes[size], { color: v.text }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
