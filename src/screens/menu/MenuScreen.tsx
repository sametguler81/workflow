import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { Avatar } from '../../components/Avatar';

interface MenuScreenProps {
    onNavigateInvoiceList: () => void;
    onNavigateAttendance: () => void;
    onNavigateProfile: () => void;
    onNavigateSettings: () => void;
    onNavigateReports: () => void;
    onNavigateInvoiceUpload?: () => void;
    onNavigateDocuments?: () => void;
}

interface MenuItem {
    key: string;
    icon: string;
    label: string;
    subtitle: string;
    onPress: () => void;
    color: string;
}

export function MenuScreen({
    onNavigateInvoiceList,
    onNavigateAttendance,
    onNavigateProfile,
    onNavigateSettings,
    onNavigateReports,
    onNavigateInvoiceUpload,
    onNavigateDocuments,
}: MenuScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();

    const isAdminRole = profile?.role === 'idari' || profile?.role === 'muhasebe' || profile?.role === 'admin';

    const menuItems: MenuItem[] = [
        // Belgeler — sadece idari/muhasebe/admin
        ...(isAdminRole ? [{
            key: 'upload',
            icon: 'cloud-upload-outline',
            label: 'Belge Yükle',
            subtitle: 'Fatura veya Fiş Yükle',
            onPress: () => onNavigateInvoiceUpload && onNavigateInvoiceUpload(),
            color: '#F59E0B', // Amber color for action
        }] : []),
        ...(isAdminRole ? [{
            key: 'documents',
            icon: 'folder-open-outline',
            label: 'Belge Yönetimi',
            subtitle: 'Tüm belge ve fişler',
            onPress: () => onNavigateDocuments && onNavigateDocuments(),
            color: '#8B5CF6',
        }] : []),
        ...(isAdminRole ? [{
            key: 'invoices',
            icon: 'wallet-outline',
            label: 'Ön Muhasebe',
            subtitle: 'Gelir, Gider ve Kasa',
            onPress: onNavigateInvoiceList,
            color: '#3B82F6',
        }] : []),
        // Raporlar — sadece idari/muhasebe/admin
        ...(isAdminRole ? [{
            key: 'reports',
            icon: 'bar-chart-outline',
            label: 'Raporlar',
            subtitle: 'İstatistik ve analizler',
            onPress: onNavigateReports,
            color: '#0284C7',
        }] : []),
        {
            key: 'attendance',
            icon: 'scan-outline',
            label: 'Yoklama',
            subtitle: 'QR kod ve raporlar',
            onPress: onNavigateAttendance,
            color: '#059669',
        },
        {
            key: 'profile',
            icon: 'person-outline',
            label: 'Profil',
            subtitle: 'Hesap bilgileri',
            onPress: onNavigateProfile,
            color: '#8B5CF6',
        },
        {
            key: 'settings',
            icon: 'settings-outline',
            label: 'Ayarlar',
            subtitle: 'Tercihler',
            onPress: onNavigateSettings,
            color: '#64748B',
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Menü</Text>
                </View>

                {/* Profile Card */}
                <TouchableOpacity
                    style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                    onPress={onNavigateProfile}
                    activeOpacity={0.7}
                >
                    <Avatar name={profile?.displayName || 'U'} size={48} color={Colors.primary} imageUrl={profile?.photoURL} />
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>
                            {profile?.displayName || 'Kullanıcı'}
                        </Text>
                        <Text style={[styles.profileRole, { color: colors.textTertiary }]}>
                            {profile?.role === 'idari' ? 'İdari Personel' :
                                profile?.role === 'muhasebe' ? 'Muhasebe' :
                                    profile?.role === 'admin' ? 'Yönetici' : 'Personel'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                {/* Menu Grid */}
                <View style={styles.grid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.color + '12' }]}>
                                <Ionicons name={item.icon as any} size={24} color={item.color} />
                            </View>
                            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                            <Text style={[styles.menuSubtitle, { color: colors.textTertiary }]}>{item.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 30 },
    header: {
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },

    // Profile Card
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
    },
    profileInfo: { flex: 1, marginLeft: 14 },
    profileName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    profileRole: { fontSize: 13, fontWeight: '500' },

    // Menu Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    menuCard: {
        width: '47%' as any,
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 12,
        fontWeight: '400',
    },
});
