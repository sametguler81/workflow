import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface InputFieldProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    error?: string;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
}

export function InputField({
    label,
    icon,
    error,
    containerStyle,
    isPassword,
    style,
    ...props
}: InputFieldProps) {
    const { colors, isDark } = useTheme();
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.inputBackground,
                        borderColor: error
                            ? '#FF5C5C'
                            : focused
                                ? '#6C63FF'
                                : colors.border,
                        borderWidth: focused ? 1.5 : 1,
                    },
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={focused ? '#6C63FF' : colors.textTertiary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                        },
                        style,
                    ]}
                    placeholderTextColor={colors.textTertiary}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={colors.textTertiary}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text style={styles.error}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        letterSpacing: 0.3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        height: 52,
    },
    icon: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        fontSize: 15,
        height: '100%',
    },
    error: {
        color: '#FF5C5C',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
