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
import { Avatar } from '../../components/Avatar';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getCompanyLeaves, LeaveRequest } from '../../services/leaveService';
import { getCompanyExpenses, Expense } from '../../services/expenseService';
import { getCompanyMembers } from '../../services/companyService';
import { getAttendanceByDate } from '../../services/attendanceService';
import { getUnreadCount } from '../../services/announcementService';

interface IdariDashboardProps {
    onNavigateLeaveList: () => void;
    onNavigateExpenseList: () => void;
    onNavigateNewLeave: () => void;
    onNavigateLeaveDetail: (leaveId: string) => void;
    onNavigateAttendanceQR?: () => void;
    onNavigateAttendanceReport?: () => void;
    onNavigateAnnouncements?: () => void;
    onNavigateCompanyCalendar?: () => void;
}

export function IdariDashboard({
    onNavigateLeaveList,
    onNavigateExpenseList,
    onNavigateNewLeave,
    onNavigateLeaveDetail,
    onNavigateAttendanceQR,
    onNavigateAttendanceReport,
    onNavigateAnnouncements,
    onNavigateCompanyCalendar,
}: IdariDashboardProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [memberCount, setMemberCount] = useState(0);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            // Use local date string construction to match attendanceService
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${d}`;

            const [lRes, eRes, members, todayAttendance, unread] = await Promise.all([
                getCompanyLeaves(profile.companyId),
                getCompanyExpenses(profile.companyId),
                getCompanyMembers(profile.companyId),
                getAttendanceByDate(profile.companyId, todayStr),
                getUnreadCount(profile.companyId, profile.uid),
            ]);

            // Filter members: only 'personel' and 'muhasebe' are subject to attendance
            const targetMembers = members.filter((m: any) => m.role === 'personel' || m.role === 'muhasebe');

            // Filter attendance: count only if the user is in targetMembers
            const targetMemberIds = new Set(targetMembers.map((m: any) => m.uid));
            const validAttendanceCount = todayAttendance.filter((a: any) => targetMemberIds.has(a.userId)).length;

            setLeaves(lRes.data);
            setExpenses(eRes.data);
            setMemberCount(targetMembers.length);
            setAttendanceCount(validAttendanceCount);
            setUnreadCount(unread);

            // Populate member map for avatars
            const map: Record<string, any> = {};
            members.forEach((m: any) => map[m.uid] = m);
            setMemberMap(map);
        } catch (err) {
            console.error(err);
        }
    }, [profile]);

    // Create a map for quick member lookup
    const [memberMap, setMemberMap] = useState<Record<string, any>>({});

    // Member map is now handled in loadData to reduce reads

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const pendingLeaves = leaves.filter((l) => l.status === 'pending');

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
                    {/* Stats */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Genel Durum</Text>
                    <View style={styles.statsGrid}>
                        <ModernStatCard
                            title="Bekleyen İzin"
                            value={pendingLeaves.length}
                            icon="hourglass-outline"
                            color={Colors.gradientDanger[1]}
                        />
                        <ModernStatCard
                            title="Personel"
                            value={memberCount}
                            icon="people-outline"
                            color={Colors.info}
                        />
                    </View>

                    <View style={[styles.statsGrid, { marginTop: Spacing.md }]}>
                        <ModernStatCard
                            title="Toplam İzin"
                            value={leaves.length}
                            icon="calendar-outline"
                            color={Colors.secondary}
                        />
                        <ModernStatCard
                            title="Bugün Yoklama"
                            value={`${attendanceCount}/${memberCount}`}
                            icon="scan-outline"
                            color={Colors.success}
                        />
                    </View>

                    {/* Quick Actions */}
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.xxl }]}>Hızlı Yönetim</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateNewLeave}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '10' }]}>
                                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>İzin Talebi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateAttendanceQR}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.success + '10' }]}>
                                <Ionicons name="qr-code-outline" size={24} color={Colors.success} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>QR Oluştur</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateAttendanceReport}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.accent + '10' }]}>
                                <Ionicons name="bar-chart-outline" size={24} color={Colors.accent} />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Raporlar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={onNavigateCompanyCalendar}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '10' }]}>
                                <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={[styles.actionText, { color: colors.text }]}>Takvim</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Pending Leave Requests */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>Bekleyen İzinler</Text>
                        <TouchableOpacity onPress={onNavigateLeaveList}>
                            <Text style={styles.seeAllText}>Tümü</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingLeaves.slice(0, 5).map((leave) => (
                        <TouchableOpacity
                            key={leave.id}
                            style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={() => onNavigateLeaveDetail(leave.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.listItemIcon}>
                                <Avatar
                                    name={leave.userName}
                                    size={36}
                                    imageUrl={memberMap[leave.userId]?.photoURL}
                                />
                            </View>
                            <View style={styles.listItemContent}>
                                <Text style={[styles.listItemTitle, { color: colors.text }]}>
                                    {leave.userName}
                                </Text>
                                <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                                    {leave.type === 'yillik' ? 'Yıllık' : leave.type === 'hastalik' ? 'Hastalık' : 'Ücretsiz'} • {leave.startDate}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}

                    {pendingLeaves.length === 0 && (
                        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                            <Ionicons name="checkmark-done-circle" size={32} color={Colors.success} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Bekleyen talep yok
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
    actionsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    actionCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.sm + 4,
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
        fontSize: 10,
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
