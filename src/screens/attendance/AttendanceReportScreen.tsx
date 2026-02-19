import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { StatCard } from '../../components/StatCard';
import { Avatar } from '../../components/Avatar';
import {
    getAttendanceByDate,
    AttendanceRecord,
} from '../../services/attendanceService';
import { getCompanyMembers } from '../../services/companyService';
import { getCompanyLeaves, LeaveRequest } from '../../services/leaveService';

interface AttendanceReportScreenProps {
    onBack: () => void;
}

export function AttendanceReportScreen({ onBack }: AttendanceReportScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [totalMembers, setTotalMembers] = useState(0);
    const [absentMembers, setAbsentMembers] = useState<{ name: string; isLeave: boolean; uid: string }[]>([]);
    const [dailyLeaves, setDailyLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getDateString = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date('Invalid');
        if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
        return new Date(dateStr);
    };

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const dateStr = getDateString(selectedDate);
            const [attendance, members, leavesResult] = await Promise.all([
                getAttendanceByDate(profile.companyId, dateStr),
                getCompanyMembers(profile.companyId),
                getCompanyLeaves(profile.companyId, 100, null, { status: 'approved' })
            ]);

            setRecords(attendance);
            setTotalMembers(members.length);
            setDailyLeaves(leavesResult.data);

            // Find absent members
            const presentIds = new Set(attendance.map((a: AttendanceRecord) => a.userId));

            // Filter leaves for selected date
            const targetDate = new Date(selectedDate);
            targetDate.setHours(0, 0, 0, 0);

            const absentList = members
                .filter((m: any) => !presentIds.has(m.uid))
                .map((m: any) => {
                    const isOnLeave = leavesResult.data.some((l: LeaveRequest) => {
                        if (l.userId !== m.uid) return false;
                        const start = parseDate(l.startDate);
                        const end = parseDate(l.endDate);
                        start.setHours(0, 0, 0, 0);
                        end.setHours(0, 0, 0, 0);
                        return targetDate >= start && targetDate <= end;
                    });

                    return {
                        name: m.displayName || m.email,
                        uid: m.uid,
                        isLeave: isOnLeave
                    };
                });

            setAbsentMembers(absentList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [profile, selectedDate]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const onDateChange = (_: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) setSelectedDate(date);
    };

    const goToPreviousDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        if (next <= new Date()) {
            setSelectedDate(next);
        }
    };

    const formatDate = (date: Date) => {
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
    };

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const isToday = getDateString(selectedDate) === getDateString(new Date());
    const presentCount = records.length;
    const absentCount = totalMembers - presentCount;
    const attendanceRate = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#667eea', '#764ba2'] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Yoklama Raporu</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Date Selector */}
                    <View style={[styles.dateSelector, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <TouchableOpacity onPress={goToPreviousDay} style={styles.dateArrow}>
                            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={styles.dateCenter}
                        >
                            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                            <Text style={[styles.dateText, { color: colors.text }]}>
                                {formatDate(selectedDate)}
                            </Text>
                            {isToday && (
                                <View style={styles.todayBadge}>
                                    <Text style={styles.todayBadgeText}>Bugün</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={goToNextDay}
                            style={styles.dateArrow}
                            disabled={isToday}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={22}
                                color={isToday ? colors.textTertiary : Colors.primary}
                            />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <StatCard
                            title="Gelen"
                            value={presentCount}
                            icon="checkmark-circle-outline"
                            gradient={Colors.gradientSuccess}
                        />
                        <StatCard
                            title="Gelmeyen"
                            value={absentCount}
                            icon="close-circle-outline"
                            gradient={Colors.gradientDanger}
                        />
                    </View>

                    <View style={[styles.statsRow, { marginTop: Spacing.md }]}>
                        <StatCard
                            title="Toplam"
                            value={totalMembers}
                            icon="people-outline"
                            gradient={Colors.gradientCard}
                        />
                        <StatCard
                            title="Oran"
                            value={`%${attendanceRate}`}
                            icon="trending-up-outline"
                        />
                    </View>

                    {/* Present List */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Gelenler
                        </Text>
                        <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                            {presentCount} kişi
                        </Text>
                    </View>

                    {records.map((record) => (
                        <View
                            key={record.id}
                            style={[styles.recordItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                        >
                            <Avatar name={record.userName} size={40} color="#667eea" />
                            <View style={styles.recordInfo}>
                                <Text style={[styles.recordName, { color: colors.text }]}>
                                    {record.userName}
                                </Text>
                                <Text style={[styles.recordTime, { color: colors.textTertiary }]}>
                                    Giriş: {formatTime(record.checkInTime)}
                                </Text>
                            </View>
                            <View style={[styles.timeBadge, { backgroundColor: Colors.successLight }]}>
                                <Ionicons name="time-outline" size={12} color={Colors.success} />
                                <Text style={styles.timeBadgeText}>
                                    {formatTime(record.checkInTime)}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {records.length === 0 && !loading && (
                        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                            <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Bu tarihte yoklama kaydı yok
                            </Text>
                        </View>
                    )}

                    {/* Absent List */}
                    {absentMembers.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    Gelmeyenler
                                </Text>
                                <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                                    {absentCount} kişi
                                </Text>
                            </View>

                            {absentMembers.map((member, index) => (
                                <View
                                    key={index}
                                    style={[styles.recordItem, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                >
                                    <Avatar name={member.name} size={40} color={member.isLeave ? Colors.warning : "#FF6B6B"} />
                                    <View style={styles.recordInfo}>
                                        <Text style={[styles.recordName, { color: colors.text }]}>
                                            {member.name}
                                        </Text>
                                        <Text style={[styles.recordTime, { color: colors.textTertiary }]}>
                                            {member.isLeave ? 'İzinli' : 'Yoklama verilmedi'}
                                        </Text>
                                    </View>
                                    <View style={[styles.timeBadge, { backgroundColor: member.isLeave ? Colors.warningLight : Colors.dangerLight }]}>
                                        <Ionicons
                                            name={member.isLeave ? "checkmark-circle-outline" : "close-outline"}
                                            size={14}
                                            color={member.isLeave ? Colors.warning : Colors.danger}
                                        />
                                        <Text style={[styles.absentBadgeText, { color: member.isLeave ? Colors.warning : Colors.danger }]}>
                                            {member.isLeave ? 'İzinli' : 'Yok'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: { padding: 4 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    content: {
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.xl,
    },
    // Date selector
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    dateArrow: {
        padding: Spacing.sm,
    },
    dateCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '600',
    },
    todayBadge: {
        backgroundColor: Colors.primary,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: BorderRadius.full,
    },
    todayBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    // Sections
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xxl,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    sectionCount: {
        fontSize: 13,
        fontWeight: '500',
    },
    // Record items
    recordItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        gap: Spacing.md,
    },
    recordInfo: {
        flex: 1,
    },
    recordName: {
        fontSize: 15,
        fontWeight: '600',
    },
    recordTime: {
        fontSize: 12,
        marginTop: 2,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    timeBadgeText: {
        color: Colors.success,
        fontSize: 12,
        fontWeight: '700',
    },
    absentBadgeText: {
        color: Colors.danger,
        fontSize: 12,
        fontWeight: '700',
    },
    // Empty
    emptyCard: {
        alignItems: 'center',
        padding: Spacing.xxl,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
