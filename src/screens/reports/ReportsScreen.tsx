import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getCompanyLeaves, LeaveRequest, LeaveType } from '../../services/leaveService';
import { getCompanyExpenses, Expense } from '../../services/expenseService';
import { getCompanyInvoices, Invoice, DocumentType, DOCUMENT_TYPE_LABELS } from '../../services/invoiceService';

type TabKey = 'leaves' | 'expenses' | 'invoices';

interface ReportsScreenProps {
    onBack: () => void;
}

// ─── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, icon, color, bgColor }: {
    label: string; value: number | string; icon: string; color: string; bgColor: string;
}) {
    const { colors } = useTheme();
    return (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
            <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
                <Ionicons name={icon as any} size={20} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
        </View>
    );
}

// ─── Progress Bar ───────────────────────────────────────
function ProgressRow({ label, count, total, color }: {
    label: string; count: number; total: number; color: string;
}) {
    const { colors } = useTheme();
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <View style={styles.progressRow}>
            <View style={styles.progressLabel}>
                <View style={[styles.progressDot, { backgroundColor: color }]} />
                <Text style={[styles.progressText, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.progressRight}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <Text style={[styles.progressCount, { color: colors.textSecondary }]}>{count}</Text>
            </View>
        </View>
    );
}

// ─── Recent Item ────────────────────────────────────────
function RecentItem({ title, subtitle, status, amount }: {
    title: string; subtitle: string; status: string; amount?: string;
}) {
    const { colors } = useTheme();
    const statusConfig: Record<string, { color: string; label: string }> = {
        pending: { color: Colors.warning, label: 'Bekleyen' },
        approved: { color: Colors.success, label: 'Onaylı' },
        rejected: { color: Colors.danger, label: 'Reddedilen' },
    };
    const s = statusConfig[status] || statusConfig.pending;

    return (
        <View style={[styles.recentItem, { borderBottomColor: colors.borderLight }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.recentTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.recentSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
            </View>
            {amount && <Text style={[styles.recentAmount, { color: colors.text }]}>{amount}</Text>}
            <View style={[styles.statusBadge, { backgroundColor: s.color + '15' }]}>
                <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
            </View>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────
export function ReportsScreen({ onBack }: ReportsScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<TabKey>('leaves');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const companyId = profile?.companyId || '';

    const fetchData = useCallback(async () => {
        if (!companyId) return;
        try {
            const [leaveRes, expenseRes, invoiceRes] = await Promise.all([
                getCompanyLeaves(companyId, 200),
                getCompanyExpenses(companyId, 200),
                getCompanyInvoices(companyId, 200),
            ]);
            setLeaves(leaveRes.data);
            setExpenses(expenseRes.data);
            setInvoices(invoiceRes.data);
        } catch (e) {
            console.error('Report fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [companyId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    // ─── Computed Stats ─────────────────────────────────
    const leaveStats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        byType: {
            yillik: leaves.filter(l => l.type === 'yillik').length,
            hastalik: leaves.filter(l => l.type === 'hastalik').length,
            ucretsiz: leaves.filter(l => l.type === 'ucretsiz').length,
        },
    };

    const expenseStats = {
        total: expenses.length,
        pending: expenses.filter(e => e.status === 'pending').length,
        approved: expenses.filter(e => e.status === 'approved').length,
        rejected: expenses.filter(e => e.status === 'rejected').length,
        totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        approvedAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0),
        pendingAmount: expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0),
    };

    const invoiceStats = {
        total: invoices.length,
        pending: invoices.filter(i => i.status === 'pending').length,
        approved: invoices.filter(i => i.status === 'approved').length,
        rejected: invoices.filter(i => i.status === 'rejected').length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.amount || 0), 0),
        byType: {
            fatura: invoices.filter(i => i.documentType === 'fatura').length,
            makbuz: invoices.filter(i => i.documentType === 'makbuz').length,
            sozlesme: invoices.filter(i => i.documentType === 'sozlesme').length,
            diger: invoices.filter(i => i.documentType === 'diger').length,
        },
    };

    const formatCurrency = (n: number) => `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR');

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'leaves', label: 'İzinler', icon: 'calendar-outline' },
        { key: 'expenses', label: 'Fişler', icon: 'receipt-outline' },
        { key: 'invoices', label: 'Belgeler', icon: 'document-text-outline' },
    ];

    const leaveTypeLabels: Record<string, string> = {
        yillik: 'Yıllık İzin',
        hastalik: 'Hastalık İzni',
        ucretsiz: 'Ücretsiz İzin',
    };

    // ─── Render Content ─────────────────────────────────
    const renderLeaves = () => (
        <>
            {/* Stats */}
            <View style={styles.statsGrid}>
                <StatCard label="Toplam" value={leaveStats.total} icon="layers-outline" color="#3B82F6" bgColor="#3B82F612" />
                <StatCard label="Bekleyen" value={leaveStats.pending} icon="time-outline" color={Colors.warning} bgColor={Colors.warningLight} />
                <StatCard label="Onaylı" value={leaveStats.approved} icon="checkmark-circle-outline" color={Colors.success} bgColor={Colors.successLight} />
                <StatCard label="Reddedilen" value={leaveStats.rejected} icon="close-circle-outline" color={Colors.danger} bgColor={Colors.dangerLight} />
            </View>

            {/* Distribution */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum Dağılımı</Text>
                <ProgressRow label="Bekleyen" count={leaveStats.pending} total={leaveStats.total} color={Colors.warning} />
                <ProgressRow label="Onaylı" count={leaveStats.approved} total={leaveStats.total} color={Colors.success} />
                <ProgressRow label="Reddedilen" count={leaveStats.rejected} total={leaveStats.total} color={Colors.danger} />
            </View>

            {/* By Type */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Türe Göre</Text>
                {Object.entries(leaveStats.byType).map(([key, count]) => (
                    <ProgressRow key={key} label={leaveTypeLabels[key] || key} count={count} total={leaveStats.total} color="#3B82F6" />
                ))}
            </View>

            {/* Recent */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Son İzin Talepleri</Text>
                {leaves.slice(0, 10).map(l => (
                    <RecentItem
                        key={l.id}
                        title={l.userName}
                        subtitle={`${leaveTypeLabels[l.type] || l.type} • ${formatDate(l.startDate)} - ${formatDate(l.endDate)}`}
                        status={l.status}
                    />
                ))}
                {leaves.length === 0 && <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Henüz izin talebi yok</Text>}
            </View>
        </>
    );

    const renderExpenses = () => (
        <>
            <View style={styles.statsGrid}>
                <StatCard label="Toplam" value={expenseStats.total} icon="layers-outline" color="#3B82F6" bgColor="#3B82F612" />
                <StatCard label="Toplam Tutar" value={formatCurrency(expenseStats.totalAmount)} icon="cash-outline" color="#059669" bgColor="#05966912" />
                <StatCard label="Onaylı Tutar" value={formatCurrency(expenseStats.approvedAmount)} icon="checkmark-circle-outline" color={Colors.success} bgColor={Colors.successLight} />
                <StatCard label="Bekleyen Tutar" value={formatCurrency(expenseStats.pendingAmount)} icon="time-outline" color={Colors.warning} bgColor={Colors.warningLight} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum Dağılımı</Text>
                <ProgressRow label="Bekleyen" count={expenseStats.pending} total={expenseStats.total} color={Colors.warning} />
                <ProgressRow label="Onaylı" count={expenseStats.approved} total={expenseStats.total} color={Colors.success} />
                <ProgressRow label="Reddedilen" count={expenseStats.rejected} total={expenseStats.total} color={Colors.danger} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Fişler</Text>
                {expenses.slice(0, 10).map(e => (
                    <RecentItem
                        key={e.id}
                        title={e.userName}
                        subtitle={formatDate(e.date)}
                        status={e.status}
                        amount={formatCurrency(e.amount)}
                    />
                ))}
                {expenses.length === 0 && <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Henüz fiş yok</Text>}
            </View>
        </>
    );

    const renderInvoices = () => (
        <>
            <View style={styles.statsGrid}>
                <StatCard label="Toplam" value={invoiceStats.total} icon="layers-outline" color="#3B82F6" bgColor="#3B82F612" />
                <StatCard label="Toplam Tutar" value={formatCurrency(invoiceStats.totalAmount)} icon="cash-outline" color="#059669" bgColor="#05966912" />
                <StatCard label="Bekleyen" value={invoiceStats.pending} icon="time-outline" color={Colors.warning} bgColor={Colors.warningLight} />
                <StatCard label="Onaylı" value={invoiceStats.approved} icon="checkmark-circle-outline" color={Colors.success} bgColor={Colors.successLight} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Belge Türü Dağılımı</Text>
                {Object.entries(invoiceStats.byType).map(([key, count]) => (
                    <ProgressRow key={key} label={DOCUMENT_TYPE_LABELS[key as DocumentType] || key} count={count} total={invoiceStats.total} color="#3B82F6" />
                ))}
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum Dağılımı</Text>
                <ProgressRow label="Bekleyen" count={invoiceStats.pending} total={invoiceStats.total} color={Colors.warning} />
                <ProgressRow label="Onaylı" count={invoiceStats.approved} total={invoiceStats.total} color={Colors.success} />
                <ProgressRow label="Reddedilen" count={invoiceStats.rejected} total={invoiceStats.total} color={Colors.danger} />
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Belgeler</Text>
                {invoices.slice(0, 10).map(i => (
                    <RecentItem
                        key={i.id}
                        title={i.userName}
                        subtitle={`${DOCUMENT_TYPE_LABELS[i.documentType]} • ${formatDate(i.date)}`}
                        status={i.status}
                        amount={formatCurrency(i.amount)}
                    />
                ))}
                {invoices.length === 0 && <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Henüz belge yok</Text>}
            </View>
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={Colors.gradientPrimary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Raporlar</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#FFF' : 'rgba(255,255,255,0.6)'} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                >
                    {activeTab === 'leaves' && renderLeaves()}
                    {activeTab === 'expenses' && renderExpenses()}
                    {activeTab === 'invoices' && renderInvoices()}
                </ScrollView>
            )}
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    tabRow: {
        flexDirection: 'row',
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    tabActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
    },
    tabTextActive: {
        color: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },

    // Stat Cards
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: Spacing.lg,
    },
    statCard: {
        width: '48%' as any,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        ...Shadows.small,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '35%' as any,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
    },
    progressRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressCount: {
        fontSize: 13,
        fontWeight: '700',
        width: 30,
        textAlign: 'right',
    },

    // Section
    section: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: Spacing.md,
    },

    // Recent Items
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 10,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    recentSubtitle: {
        fontSize: 12,
    },
    recentAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
        fontSize: 14,
    },
});
