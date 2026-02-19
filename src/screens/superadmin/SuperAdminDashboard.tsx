import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme/theme';
import { getPlatformStats, PlatformStats, createCompanyAdmin } from '../../services/superAdminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { logoutUser } from '../../services/authService';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';

interface SuperAdminDashboardProps {
    onNavigateCompanies: () => void;
    onNavigateUsers: () => void;
    onNavigateSubscriptions: () => void;
    onNavigateReports: () => void;
    onNavigateCompanyDetail: (companyId: string) => void;
}

export function SuperAdminDashboard({
    onNavigateCompanies,
    onNavigateUsers,
    onNavigateSubscriptions,
    onNavigateReports,
    onNavigateCompanyDetail,
}: SuperAdminDashboardProps) {
    const { profile } = useAuth();
    const { colors, isDark } = useTheme();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Add Company State
    const [addCompanyModal, setAddCompanyModal] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newOwnerName, setNewOwnerName] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [newOwnerPassword, setNewOwnerPassword] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
    const [registering, setRegistering] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const data = await getPlatformStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load platform stats:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const onRefresh = () => { setRefreshing(true); fetchStats(); };

    const handleCreateCompany = async () => {
        if (!newCompanyName || !newOwnerName || !newOwnerEmail || !newOwnerPassword) {
            alert('Lütfen tüm alanları doldurun.');
            return;
        }
        setRegistering(true);
        try {
            await createCompanyAdmin(newCompanyName.trim(), selectedPlan, newOwnerName.trim(), newOwnerEmail.trim(), newOwnerPassword);
            alert('Firma başarıyla oluşturuldu!');
            setAddCompanyModal(false);
            setNewCompanyName('');
            setNewOwnerName('');
            setNewOwnerEmail('');
            setNewOwnerPassword('');
            fetchStats();
        } catch (error: any) {
            console.error(error);
            alert('Hata: ' + (error.message || 'Firma oluşturulamadı.'));
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <LoadingSpinner message="Platform yükleniyor..." />;

    const quickActions = [
        { key: 'companies', icon: 'business-outline', label: 'Firmalar', value: stats?.totalCompanies || 0, color: '#3B82F6', onPress: onNavigateCompanies },
        { key: 'users', icon: 'people-outline', label: 'Kullanıcılar', value: stats?.totalUsers || 0, color: '#8B5CF6', onPress: onNavigateUsers },
        { key: 'subscriptions', icon: 'card-outline', label: 'Abonelikler', value: `${stats?.planDistribution.pro || 0} Pro`, color: '#059669', onPress: onNavigateSubscriptions },
        { key: 'reports', icon: 'bar-chart-outline', label: 'Raporlar', value: 'Görüntüle', color: '#D97706', onPress: onNavigateReports },
    ];



    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#0F172A', '#1E293B', '#334155'] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerGreeting}>Admin Panel</Text>
                            <Text style={styles.headerName}>{profile?.displayName || 'Admin'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[styles.logoutBtn, { backgroundColor: Colors.primary }]}
                                onPress={() => setAddCompanyModal(true)}
                            >
                                <Ionicons name="add" size={22} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.logoutBtn}
                                onPress={() => logoutUser()}
                            >
                                <Ionicons name="log-out-outline" size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Platform Overview */}
                    <View style={styles.overviewRow}>
                        <View style={styles.overviewItem}>
                            <Text style={styles.overviewValue}>{stats?.totalCompanies || 0}</Text>
                            <Text style={styles.overviewLabel}>Firma</Text>
                        </View>
                        <View style={[styles.overviewDivider]} />
                        <View style={styles.overviewItem}>
                            <Text style={styles.overviewValue}>{stats?.totalUsers || 0}</Text>
                            <Text style={styles.overviewLabel}>Kullanıcı</Text>
                        </View>
                        <View style={[styles.overviewDivider]} />
                        <View style={styles.overviewItem}>
                            <Text style={styles.overviewValue}>{stats?.planDistribution.pro || 0}</Text>
                            <Text style={styles.overviewLabel}>Pro Plan</Text>
                        </View>
                        <View style={[styles.overviewDivider]} />
                        <View style={styles.overviewItem}>
                            <Text style={styles.overviewValue}>{stats?.planDistribution.enterprise || 0}</Text>
                            <Text style={styles.overviewLabel}>Kurumsal</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Quick Actions */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı Erişim</Text>
                    <View style={styles.quickGrid}>
                        {quickActions.map(action => (
                            <TouchableOpacity
                                key={action.key}
                                style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                onPress={action.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: action.color + '15' }]}>
                                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                                </View>
                                <Text style={[styles.quickValue, { color: colors.text }]}>{action.value}</Text>
                                <Text style={[styles.quickLabel, { color: colors.textTertiary }]}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>



                    {/* Plan Distribution */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Dağılımı</Text>
                    <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        {[
                            { label: 'Ücretsiz', count: stats?.planDistribution.free || 0, color: '#64748B' },
                            { label: 'Profesyonel', count: stats?.planDistribution.pro || 0, color: '#3B82F6' },
                            { label: 'Kurumsal', count: stats?.planDistribution.enterprise || 0, color: '#8B5CF6' },
                        ].map(plan => {
                            const total = stats?.totalCompanies || 1;
                            const pct = Math.round((plan.count / total) * 100);
                            return (
                                <View key={plan.label} style={styles.planRow}>
                                    <View style={styles.planInfo}>
                                        <View style={[styles.planDot, { backgroundColor: plan.color }]} />
                                        <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                                    </View>
                                    <View style={styles.planBarWrap}>
                                        <View style={[styles.planBarBg, { backgroundColor: colors.surfaceVariant }]}>
                                            <View style={[styles.planBarFill, { width: `${pct}%`, backgroundColor: plan.color }]} />
                                        </View>
                                        <Text style={[styles.planCount, { color: colors.textSecondary }]}>{plan.count}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Recent Companies */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Eklenen Firmalar</Text>
                    <View style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        {stats?.recentCompanies.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Henüz firma yok</Text>
                        )}
                        {stats?.recentCompanies.map((company: any, i: number) => (
                            <TouchableOpacity
                                key={company.id}
                                style={[
                                    styles.recentRow,
                                    i < (stats?.recentCompanies.length || 0) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }
                                ]}
                                onPress={() => onNavigateCompanyDetail(company.id)}
                            >
                                <View style={[styles.companyAvatar, { backgroundColor: '#3B82F615' }]}>
                                    <Ionicons name="business" size={18} color="#3B82F6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.recentName, { color: colors.text }]}>{company.name}</Text>
                                    <Text style={[styles.recentSub, { color: colors.textTertiary }]}>
                                        {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                                    </Text>
                                </View>
                                <View style={[styles.planBadge, { backgroundColor: company.plan === 'pro' ? '#3B82F615' : company.plan === 'enterprise' ? '#8B5CF615' : '#64748B15' }]}>
                                    <Text style={[styles.planBadgeText, { color: company.plan === 'pro' ? '#3B82F6' : company.plan === 'enterprise' ? '#8B5CF6' : '#64748B' }]}>
                                        {company.plan === 'pro' ? 'Pro' : company.plan === 'enterprise' ? 'Kurumsal' : 'Ücretsiz'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Recent Users */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Kayıt Olan Kullanıcılar</Text>
                    <View style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        {stats?.recentUsers.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Henüz kullanıcı yok</Text>
                        )}
                        {stats?.recentUsers.map((user: any, i: number) => (
                            <View
                                key={user.uid}
                                style={[
                                    styles.recentRow,
                                    i < (stats?.recentUsers.length || 0) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }
                                ]}
                            >
                                <View style={[styles.companyAvatar, { backgroundColor: '#8B5CF615' }]}>
                                    <Ionicons name="person" size={18} color="#8B5CF6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.recentName, { color: colors.text }]}>{user.displayName || 'İsimsiz'}</Text>
                                    <Text style={[styles.recentSub, { color: colors.textTertiary }]}>{user.email}</Text>
                                </View>
                                <View style={[styles.planBadge, { backgroundColor: Colors.primary + '15' }]}>
                                    <Text style={[styles.planBadgeText, { color: Colors.primary }]}>{user.role}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Add Company Modal */}
            {addCompanyModal && (
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Firma Ekle</Text>
                            <TouchableOpacity onPress={() => setAddCompanyModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <InputField
                                label="Firma Adı"
                                value={newCompanyName}
                                onChangeText={setNewCompanyName}
                                placeholder="Örn: Teknoloji A.Ş."
                                icon="business-outline"
                            />

                            <Text style={{ color: colors.text, fontWeight: '700', marginTop: 10, marginBottom: 10 }}>Abonelik Planı</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                                {['free', 'pro', 'enterprise'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        onPress={() => setSelectedPlan(p as any)}
                                        style={{
                                            flex: 1,
                                            padding: 8,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: selectedPlan === p ? Colors.primary : colors.border,
                                            backgroundColor: selectedPlan === p ? Colors.primary + '15' : 'transparent',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Text style={{
                                            color: selectedPlan === p ? Colors.primary : colors.textTertiary,
                                            fontWeight: '700',
                                            textTransform: 'capitalize'
                                        }}>
                                            {p}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <InputField
                                label="Yönetici Ad Soyad"
                                value={newOwnerName}
                                onChangeText={setNewOwnerName}
                                placeholder="Ad Soyad"
                                icon="person-outline"
                            />
                            <InputField
                                label="Yönetici Email"
                                value={newOwnerEmail}
                                onChangeText={setNewOwnerEmail}
                                placeholder="ornek@sirket.com"
                                icon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <InputField
                                label="Yönetici Şifre"
                                value={newOwnerPassword}
                                onChangeText={setNewOwnerPassword}
                                placeholder="******"
                                icon="lock-closed-outline"
                                secureTextEntry
                            />

                            <PremiumButton
                                title="Firma Oluştur"
                                onPress={handleCreateCompany}
                                loading={registering}
                                style={{ marginTop: 10 }}
                            />
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 24, // Changed from 30 to 24 to match original
        paddingHorizontal: Spacing.xl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerGreeting: {
        fontSize: 13, // Changed from 14 to 13 to match original
        color: 'rgba(255,255,255,0.6)', // Changed from '#94A3B8' to original
        fontWeight: '600',
        letterSpacing: 1, // Added to match original
        textTransform: 'uppercase', // Added to match original
        marginBottom: 4, // Added to match original
    },
    headerName: {
        fontSize: 26, // Changed from 24 to 26 to match original
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5, // Added to match original
    },
    logoutBtn: {
        width: 44, // Changed from 40 to 44 to match original
        height: 44, // Changed from 40 to 44 to match original
        borderRadius: 22, // Changed from 12 to 22 to match original
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overviewRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.08)', // Added to match original
        borderRadius: BorderRadius.xl, // Added to match original
        paddingVertical: 16, // Added to match original
    },
    overviewItem: {
        flex: 1, // Added to match original
        alignItems: 'center',
    },
    overviewValue: {
        fontSize: 22, // Changed from 28 to 22 to match original
        fontWeight: '800',
        color: '#FFF',
        // marginBottom: 4, // Removed to match original
    },
    overviewLabel: {
        fontSize: 11, // Changed from 13 to 11 to match original
        color: 'rgba(255,255,255,0.5)', // Changed from '#94A3B8' to original
        fontWeight: '600',
        marginTop: 2, // Added to match original
    },
    overviewDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)', // Changed from 'rgba(255,255,255,0.1)' to original
        // height: 40, // Removed to match original
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: 100,
    },
    sectionTitle: {
        ...Typography.h4,
        marginBottom: Spacing.md,
        color: '#1E293B', // Will be overridden by inline style if needed, but good default
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: Spacing.xxl,
    },
    quickCard: {
        width: '48%' as any,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
    },
    quickIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    quickValue: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 2,
    },
    quickLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    activityCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: Spacing.xxl,
        ...Shadows.small,
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    activityValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    planCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.xxl,
        ...Shadows.small,
    },
    planRow: {
        marginBottom: 14,
    },
    planInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    planDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    planLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    planBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    planBarBg: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    planBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    planCount: {
        fontSize: 13,
        fontWeight: '700',
        width: 30,
        textAlign: 'right',
    },
    recentCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: Spacing.xxl,
        ...Shadows.small,
    },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: Spacing.lg,
        gap: 12,
    },
    companyAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    recentSub: {
        fontSize: 12,
    },
    planBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    planBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 14,
    },
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center', zIndex: 100,
    },
    modalCard: {
        width: '90%', padding: 20, borderRadius: 24, ...Shadows.large, elevation: 10,
    },
    modalTitle: { fontSize: 20, fontWeight: '800' },
});
