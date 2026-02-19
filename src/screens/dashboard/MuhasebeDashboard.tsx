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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { ModernStatCard } from '../../components/ModernStatCard';
import { DashboardHeader } from '../../components/DashboardHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getCompanyExpenses, Expense } from '../../services/expenseService';
import { getUnreadCount } from '../../services/announcementService';

interface MuhasebeDashboardProps {
    onNavigateExpenseList: () => void;
    onNavigateExpenseDetail: (expenseId: string) => void;
    onNavigateNewLeave: () => void;
    onNavigateAnnouncements?: () => void;
    onNavigateFinance?: () => void;
    onNavigateDocuments?: () => void;
}

export function MuhasebeDashboard({
    onNavigateExpenseList,
    onNavigateExpenseDetail,
    onNavigateNewLeave,
    onNavigateAnnouncements,
    onNavigateFinance,
    onNavigateDocuments,
}: MuhasebeDashboardProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const [res, unread] = await Promise.all([
                getCompanyExpenses(profile.companyId),
                getUnreadCount(profile.companyId, profile.uid),
            ]);
            setExpenses(res.data);
            setUnreadCount(unread);
        } catch (err) {
            console.error(err);
        }
    }, [profile]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const pendingExpenses = expenses.filter((e) => e.status === 'pending');
    const approvedExpenses = expenses.filter((e) => e.status === 'approved');
    const rejectedExpenses = expenses.filter((e) => e.status === 'rejected');
    const totalApproved = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const approvalRate = expenses.length > 0
        ? Math.round((approvedExpenses.length / (approvedExpenses.length + rejectedExpenses.length || 1)) * 100)
        : 0;

    const receivables = expenses
        .filter(e => e.userId === profile?.uid && e.status === 'approved' && e.paymentMethod === 'personal' && !e.isReimbursed)
        .reduce((sum, e) => sum + e.amount, 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <DashboardHeader
                userName={profile?.displayName}
                companyName={profile?.companyName}
                userPhoto={profile?.photoURL}
                notificationCount={unreadCount}
                onNotificationPress={onNavigateAnnouncements}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                <View style={styles.content}>
                    {/* Stats */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Finansal Özet</Text>
                    <View style={styles.statsGrid}>
                        <ModernStatCard
                            title="Bekleyen Fiş"
                            value={pendingExpenses.length}
                            icon="hourglass-outline"
                            color={Colors.warning}
                        />
                        <ModernStatCard
                            title="Aylık Gider"
                            value={`₺${totalApproved.toFixed(0)}`}
                            icon="wallet-outline"
                            color={Colors.success}
                        />
                    </View>

                    <View style={[styles.statsGrid, { marginTop: Spacing.md }]}>
                        <ModernStatCard
                            title="Toplam Fiş"
                            value={expenses.length}
                            icon="receipt-outline"
                            color={Colors.secondary}
                        />
                        <ModernStatCard
                            title="Alacaklarım"
                            value={`₺${receivables.toFixed(2)}`}
                            icon="cash-outline"
                            color={Colors.info}
                        />
                    </View>

                    {/* Approval Progress */}
                    <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                        <Text style={[styles.progressTitle, { color: colors.text }]}>Onay Durumu</Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${approvalRate}%`,
                                        backgroundColor: Colors.success,
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={[styles.progressLabel, { color: Colors.success }]}>
                                ✓ {approvedExpenses.length} Onay
                            </Text>
                            <Text style={[styles.progressLabel, { color: Colors.danger }]}>
                                ✗ {rejectedExpenses.length} Red
                            </Text>
                        </View>
                    </View>

                    {/* Quick Action Grid */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xxl }]}>İşlemler</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.actionsScrollContent}
                    >
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateNewLeave}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '10' }]}>
                                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>İzin Talebi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateFinance}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.secondary + '10' }]}>
                                <Ionicons name="wallet-outline" size={22} color={Colors.secondary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Ön Muhasebe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateDocuments}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '10' }]}>
                                <Ionicons name="folder-open-outline" size={22} color="#8B5CF6" />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Belgeler</Text>
                        </TouchableOpacity>

                        {/* Add more scrollable items here if needed later */}
                    </ScrollView>

                    {/* Pending Expenses */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>Bekleyen Fişler</Text>
                        <TouchableOpacity onPress={onNavigateExpenseList}>
                            <Text style={styles.seeAllText}>Tümü</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingExpenses.slice(0, 5).map((expense) => (
                        <TouchableOpacity
                            key={expense.id}
                            style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={() => onNavigateExpenseDetail(expense.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.listItemIcon}>
                                <Ionicons name="receipt-outline" size={20} color={Colors.warning} />
                            </View>
                            <View style={styles.listItemContent}>
                                <Text style={[styles.listItemTitle, { color: colors.text }]}>
                                    {expense.userName}
                                </Text>
                                <Text style={[styles.listItemTitle, { color: Colors.primary, fontSize: 13, marginTop: 2 }]}>
                                    ₺{expense.amount.toFixed(2)}
                                </Text>
                                <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                                    {expense.description.substring(0, 30)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}

                    {pendingExpenses.length === 0 && (
                        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                            <Ionicons name="documents-outline" size={32} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Bekleyen fiş yok
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: Spacing.md,
        letterSpacing: -0.3,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    seeAllText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    progressCard: {
        marginTop: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionsScrollContent: {
        gap: 12,
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    actionCard: {
        width: 100, // Square shape
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        ...Shadows.small,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    listItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.warning + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    listItemContent: {
        flex: 1,
    },
    listItemTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    listItemSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyCard: {
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        borderStyle: 'dashed',
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: 13,
    },
});
