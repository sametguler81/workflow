import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

interface AvatarProps {
    name: string;
    size?: number;
    color?: string;
}

export function Avatar({ name, size = 44, color }: AvatarProps) {
    const { colors } = useTheme();
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const bgColor = color || Colors.primary;

    return (
        <View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bgColor,
                },
            ]}
        >
            <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#FFF',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
