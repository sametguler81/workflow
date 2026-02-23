import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { logoutUser } from '../../services/authService';

interface SettingsScreenProps {
    onBack: () => void;
    onNavigateProfile: () => void;
    onNavigateCompanyManagement: () => void;
    onNavigatePrivacyPolicy: () => void;
    onNavigateSubscription: () => void;
}

export function SettingsScreen({ onBack, onNavigateProfile, onNavigateCompanyManagement, onNavigatePrivacyPolicy, onNavigateSubscription }: SettingsScreenProps) {
    const { profile } = useAuth();
    const { colors, isDark, mode, setMode } = useTheme();

    const isAdmin = profile?.role === 'admin';
    const isIdari = profile?.role === 'idari';
    const canManageSubscription = isAdmin || isIdari;

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await logoutUser();
                    } catch (err) {
                        Alert.alert('Hata', 'Çıkış yapılamadı.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Ayarlar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Account Section */}
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>HESAP</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <SettingRow
                        icon="person-outline"
                        label="Profil"
                        onPress={onNavigateProfile}
                        colors={colors}
                    />
                    {isAdmin && (
                        <SettingRow
                            icon="people-outline"
                            label="Firma Yönetimi"
                            onPress={onNavigateCompanyManagement}
                            colors={colors}
                        />
                    )}
                    {canManageSubscription && (
                        <SettingRow
                            icon="card-outline"
                            label="Aboneliklerim"
                            onPress={onNavigateSubscription}
                            colors={colors}
                        />
                    )}
                </View>

                {/* Appearance Section */}
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>GÖRÜNÜM</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={styles.themeRow}>
                        <View style={styles.themeLeft}>
                            <View style={[styles.iconBg, { backgroundColor: Colors.primary + '15' }]}>
                                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={Colors.primary} />
                            </View>
                            <Text style={[styles.themeLabel, { color: colors.text }]}>Koyu Tema</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={(val) => setMode(val ? 'dark' : 'light')}
                            trackColor={{ false: '#ccc', true: Colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </View>

                {/* About Section */}
                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>HAKKINDA</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={styles.aboutRow}>
                        <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Versiyon</Text>
                        <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.7</Text>
                    </View>
                    <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Geliştirici</Text>
                        <Text style={[styles.aboutValue, { color: colors.text }]}>WorkFlow360</Text>
                    </View>
                    <SettingRow
                        icon="shield-checkmark-outline"
                        label="Gizlilik Politikası"
                        onPress={onNavigatePrivacyPolicy}
                        colors={colors}
                    />
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutBtn, { backgroundColor: Colors.dangerLight }]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function SettingRow({ icon, label, onPress, colors }: any) {
    return (
        <TouchableOpacity style={settingRowStyles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={settingRowStyles.left}>
                <View style={[settingRowStyles.iconBg, { backgroundColor: Colors.primary + '15' }]}>
                    <Ionicons name={icon} size={20} color={Colors.primary} />
                </View>
                <Text style={[settingRowStyles.label, { color: colors.text }]}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
    );
}

const settingRowStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 15, fontWeight: '600' },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: Spacing.xl },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
        marginLeft: 4,
    },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadows.small,
    },
    themeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    themeLabel: { fontSize: 15, fontWeight: '600' },
    aboutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    aboutLabel: { fontSize: 14 },
    aboutValue: { fontSize: 14, fontWeight: '600' },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.xxl,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
    },
    logoutText: {
        color: Colors.danger,
        fontSize: 16,
        fontWeight: '700',
    },
});
