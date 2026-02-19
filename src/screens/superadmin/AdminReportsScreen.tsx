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
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getPlatformReportStats } from '../../services/superAdminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminReportsScreenProps {
    onBack: () => void;
}

type ReportTab = 'overview' | 'leaves' | 'expenses' | 'invoices';

export function AdminReportsScreen({ onBack }: AdminReportsScreenProps) {
    const { colors } = useTheme();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<ReportTab>('overview');

    const fetchStats = useCallback(async () => {
        try {
            const data = await getPlatformReportStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    const onRefresh = () => { setRefreshing(true); fetchStats(); };

    if (loading) return <LoadingSpinner message="Raporlar yükleniyor..." />;

    const tabs = [
        { key: 'overview' as ReportTab, label: 'Genel', icon: 'grid-outline' },
        { key: 'leaves' as ReportTab, label: 'İzinler', icon: 'calendar-outline' },
        { key: 'expenses' as ReportTab, label: 'Masraflar', icon: 'receipt-outline' },
        { key: 'invoices' as ReportTab, label: 'Belgeler', icon: 'document-text-outline' },
    ];

    const renderStatRow = (label: string, value: string | number, color: string, icon: string) => (
        <View style={[styles.statRow, { borderBottomColor: colors.borderLight }]} key={label}>
            <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon as any} size={16} color={color} />
            </View>
            <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
    );

    const renderOverview = () => (
        <>
            {/* Companies */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    <Ionicons name="business-outline" size={16} /> Platform Özeti
                </Text>
                {renderStatRow('Toplam Firma', stats?.companies.total || 0, '#3B82F6', 'business-outline')}
                {renderStatRow('Toplam Kullanıcı', stats?.users.total || 0, '#8B5CF6', 'people-outline')}
                {renderStatRow('Toplam İzin', stats?.leaves.total || 0, '#059669', 'calendar-outline')}
                {renderStatRow('Toplam Masraf', stats?.expenses.total || 0, '#D97706', 'receipt-outline')}
                {renderStatRow('Toplam Belge', stats?.invoices.total || 0, '#DC2626', 'document-text-outline')}
            </View>

            {/* Plan Breakdown */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    <Ionicons name="layers-outline" size={16} /> Plan Dağılımı
                </Text>
                {renderStatRow('Ücretsiz', stats?.companies.byPlan.free || 0, '#64748B', 'remove-circle-outline')}
                {renderStatRow('Profesyonel', stats?.companies.byPlan.pro || 0, '#3B82F6', 'star-outline')}
                {renderStatRow('Kurumsal', stats?.companies.byPlan.enterprise || 0, '#8B5CF6', 'diamond-outline')}
            </View>

            {/* Role Breakdown */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    <Ionicons name="people-outline" size={16} /> Rol Dağılımı
                </Text>
                {renderStatRow('Personel', stats?.users.byRole.personel || 0, '#3B82F6', 'person-outline')}
                {renderStatRow('İdari', stats?.users.byRole.idari || 0, '#059669', 'shield-outline')}
                {renderStatRow('Muhasebe', stats?.users.byRole.muhasebe || 0, '#D97706', 'calculator-outline')}
                {renderStatRow('Yönetici', stats?.users.byRole.admin || 0, '#DC2626', 'key-outline')}
            </View>
        </>
    );

    const renderLeaves = () => {
        const l = stats?.leaves || {};
        const total = l.total || 1;
        const items = [
            { label: 'Bekleyen', value: l.pending || 0, color: '#D97706', pct: Math.round(((l.pending || 0) / total) * 100) },
            { label: 'Onaylanan', value: l.approved || 0, color: '#059669', pct: Math.round(((l.approved || 0) / total) * 100) },
            { label: 'Reddedilen', value: l.rejected || 0, color: '#DC2626', pct: Math.round(((l.rejected || 0) / total) * 100) },
        ];
        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>İzin İstatistikleri</Text>
                <Text style={[styles.bigNumber, { color: colors.text }]}>{l.total || 0}</Text>
                <Text style={[styles.bigLabel, { color: colors.textTertiary }]}>Toplam İzin Talebi</Text>

                <View style={styles.barRow}>
                    {items.map(it => (
                        <View key={it.label} style={[styles.barSegment, { flex: it.value || 0.1, backgroundColor: it.color }]} />
                    ))}
                </View>

                {items.map(it => (
                    <View key={it.label} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: it.color }]} />
                        <Text style={[styles.legendLabel, { color: colors.text }]}>{it.label}</Text>
                        <Text style={[styles.legendValue, { color: it.color }]}>{it.value}</Text>
                        <Text style={[styles.legendPct, { color: colors.textTertiary }]}>%{it.pct}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderExpenses = () => {
        const e = stats?.expenses || {};
        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Masraf İstatistikleri</Text>
                <Text style={[styles.bigNumber, { color: colors.text }]}>
                    ₺{(e.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.bigLabel, { color: colors.textTertiary }]}>Toplam Masraf Tutarı</Text>

                {renderStatRow('Toplam Talep', e.total || 0, '#3B82F6', 'receipt-outline')}
                {renderStatRow('Bekleyen', e.pending || 0, '#D97706', 'time-outline')}
                {renderStatRow('Onaylanan', e.approved || 0, '#059669', 'checkmark-circle-outline')}
                {renderStatRow('Reddedilen', e.rejected || 0, '#DC2626', 'close-circle-outline')}
                {renderStatRow(
                    'Onaylanan Tutar',
                    `₺${(e.approvedAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                    '#059669',
                    'cash-outline'
                )}
            </View>
        );
    };

    const renderInvoices = () => {
        const inv = stats?.invoices || {};
        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Belge İstatistikleri</Text>
                <Text style={[styles.bigNumber, { color: colors.text }]}>{inv.total || 0}</Text>
                <Text style={[styles.bigLabel, { color: colors.textTertiary }]}>Toplam Belge</Text>

                {renderStatRow('Bekleyen', inv.pending || 0, '#D97706', 'time-outline')}
                {renderStatRow('Onaylanan', inv.approved || 0, '#059669', 'checkmark-circle-outline')}
                {renderStatRow('Reddedilen', inv.rejected || 0, '#DC2626', 'close-circle-outline')}
                {renderStatRow(
                    'Toplam Tutar',
                    `₺${(inv.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
                    '#3B82F6',
                    'cash-outline'
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Header */}
                <LinearGradient colors={['#0F172A', '#1E293B'] as any} style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Platform Raporları</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabRow}>
                        {tabs.map(t => (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.tab, tab === t.key && styles.tabActive]}
                                onPress={() => setTab(t.key)}
                            >
                                <Ionicons
                                    name={t.icon as any}
                                    size={16}
                                    color={tab === t.key ? '#FFF' : 'rgba(255,255,255,0.4)'}
                                />
                                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {tab === 'overview' && renderOverview()}
                    {tab === 'leaves' && renderLeaves()}
                    {tab === 'expenses' && renderExpenses()}
                    {tab === 'invoices' && renderInvoices()}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 55, paddingBottom: 16, paddingHorizontal: Spacing.xl },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    tabRow: { flexDirection: 'row', gap: 6 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 9, borderRadius: 12, gap: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    tabActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
    tabText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
    tabTextActive: { color: '#FFF' },
    content: { padding: Spacing.xl, paddingBottom: 100 },
    card: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.small,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
    bigNumber: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
    bigLabel: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
    statRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, gap: 10,
    },
    statIcon: {
        width: 32, height: 32, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
    },
    statLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
    statValue: { fontSize: 16, fontWeight: '800' },
    barRow: {
        flexDirection: 'row', height: 10, borderRadius: 5,
        overflow: 'hidden', marginBottom: 14, gap: 2,
    },
    barSegment: { borderRadius: 5 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
    legendValue: { fontSize: 14, fontWeight: '800', width: 40, textAlign: 'right' },
    legendPct: { fontSize: 12, width: 35, textAlign: 'right' },
});
