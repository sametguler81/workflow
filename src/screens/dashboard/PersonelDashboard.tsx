import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { ModernStatCard } from '../../components/ModernStatCard';
import { DashboardHeader } from '../../components/DashboardHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getUserLeaves, LeaveRequest } from '../../services/leaveService';
import { getUserExpenses, Expense } from '../../services/expenseService';
import { hasCheckedInToday } from '../../services/attendanceService';
import { getUnreadCount } from '../../services/announcementService';

interface PersonelDashboardProps {
    onNavigateLeaveList: () => void;
    onNavigateExpenseList: () => void;
    onNavigateNewLeave: () => void;
    onNavigateNewExpense: () => void;
    onNavigateAttendance?: () => void;
    onNavigateAnnouncements?: () => void;
}

const { width } = Dimensions.get('window');

export function PersonelDashboard({
    onNavigateLeaveList,
    onNavigateExpenseList,
    onNavigateNewLeave,
    onNavigateNewExpense,
    onNavigateAttendance,
    onNavigateAnnouncements,
}: PersonelDashboardProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [attendanceToday, setAttendanceToday] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const [lRes, eRes, checkedIn, unread] = await Promise.all([
                getUserLeaves(profile.uid, profile.companyId),
                getUserExpenses(profile.uid, profile.companyId),
                hasCheckedInToday(profile.uid, profile.companyId),
                getUnreadCount(profile.companyId, profile.uid),
            ]);
            setLeaves(lRes.data);
            setExpenses(eRes.data);
            setAttendanceToday(checkedIn);
            setUnreadCount(unread);
        } catch (err) {
            console.error(err);
        }
    }, [profile]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const pendingLeaves = leaves.filter((l) => l.status === 'pending').length;
    const approvedLeaves = leaves.filter((l) => l.status === 'approved').length;
    const pendingExpenses = expenses.filter((e) => e.status === 'pending').length;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <DashboardHeader
                userName={profile?.displayName}
                companyName={profile?.companyName}
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
                    {/* Stats Grid */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Genel Durum</Text>
                    <View style={styles.statsGrid}>
                        <ModernStatCard
                            title="Bekleyen İzin"
                            value={pendingLeaves}
                            icon="time-outline"
                            color={Colors.warning}
                        />
                        <ModernStatCard
                            title="Onaylı İzin"
                            value={approvedLeaves}
                            icon="checkmark-circle-outline"
                            color={Colors.success}
                        />
                    </View>
                    <View style={[styles.statsGrid, { marginTop: Spacing.md }]}>
                        <ModernStatCard
                            title="Bekleyen Fiş"
                            value={pendingExpenses}
                            icon="receipt-outline"
                            color={Colors.info}
                        />
                        <ModernStatCard
                            title="Toplam İşlem"
                            value={leaves.length + expenses.length}
                            icon="stats-chart-outline"
                            color={Colors.primary}
                        />
                    </View>

                    {/* Quick Actions */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xxl }]}>Hızlı İşlemler</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateNewLeave}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '10' }]}>
                                <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>İzin Talebi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateNewExpense}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.accent + '10' }]}>
                                <Ionicons name="camera-outline" size={24} color={Colors.accent} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Fiş Yükle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: attendanceToday ? Colors.success + '30' : colors.borderLight }]}
                            onPress={onNavigateAttendance}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: attendanceToday ? Colors.success + '10' : Colors.secondary + '10' }]}>
                                <Ionicons name={attendanceToday ? 'checkmark-circle' : 'scan-outline'} size={24} color={attendanceToday ? Colors.success : Colors.secondary} />
                            </View>
                            <Text style={[styles.actionText, { color: attendanceToday ? Colors.success : colors.text }]}>
                                {attendanceToday ? 'Yoklama Tamam' : 'Yoklama'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Leaves List */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>Son İzinler</Text>
                        <TouchableOpacity onPress={onNavigateLeaveList}>
                            <Text style={styles.seeAllText}>Tümü</Text>
                        </TouchableOpacity>
                    </View>

                    {leaves.slice(0, 3).map((leave) => (
                        <View
                            key={leave.id}
                            style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                        >
                            <View style={styles.listItemIcon}>
                                <Ionicons name="calendar" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.listItemContent}>
                                <Text style={[styles.listItemTitle, { color: colors.text }]}>
                                    {leave.type === 'yillik' ? 'Yıllık İzin' : leave.type === 'hastalik' ? 'Hastalık İzni' : 'Ücretsiz İzin'}
                                </Text>
                                <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                                    {leave.startDate} - {leave.endDate}
                                </Text>
                            </View>
                            <StatusBadge status={leave.status} size="sm" />
                        </View>
                    ))}

                    {leaves.length === 0 && (
                        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Henüz kayıt yok</Text>
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
    actionsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
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
        backgroundColor: Colors.primary + '10',
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
    },
    emptyText: {
        fontSize: 13,
    },
});
