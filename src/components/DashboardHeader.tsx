import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Spacing, Shadows, BorderRadius } from '../theme/theme';
import { Avatar } from './Avatar';

interface DashboardHeaderProps {
    userName?: string;
    companyName?: string;
    userPhoto?: string;
    notificationCount?: number;
    onNotificationPress?: () => void;
    onAvatarPress?: () => void;
    style?: ViewStyle;
}

export function DashboardHeader({
    userName,
    companyName,
    userPhoto,
    notificationCount = 0,
    onNotificationPress,
    onAvatarPress,
    style,
}: DashboardHeaderProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    paddingTop: insets.top + Spacing.lg,
                    borderColor: colors.borderLight,
                },
                style,
            ]}
        >
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                        Hoş geldiniz,
                    </Text>
                    <Text style={[styles.userName, { color: colors.text }]}>
                        {userName || 'Kullanıcı'}
                    </Text>
                    {companyName && (
                        <Text style={[styles.companyName, { color: Colors.primary }]}>
                            {companyName}
                        </Text>
                    )}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.background }]}
                        onPress={onNotificationPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="notifications-outline" size={24} color={colors.text} />
                        {notificationCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
                        <Avatar name={userName || 'U'} size={44} imageUrl={userPhoto} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...Shadows.small,
        zIndex: 10,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    textContainer: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    companyName: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.9,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingTop: 4,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: Colors.danger,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
});
