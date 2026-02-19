import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button, Modal, FlatList, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme/theme';
import { getCompanyLeaves, LeaveRequest, getLeaveTypeLabel } from '../../services/leaveService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Setup Calendar Locale
LocaleConfig.locales['tr'] = {
    monthNames: [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

interface CompanyCalendarScreenProps {
    onBack: () => void;
}

export function CompanyCalendarScreen({ onBack }: CompanyCalendarScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dayLeaves, setDayLeaves] = useState<LeaveRequest[]>([]);

    const fetchData = useCallback(async () => {
        if (!profile?.companyId) return;
        try {
            setLoading(true);
            const result = await getCompanyLeaves(profile.companyId, 100, null, { status: 'approved' });
            setLeaves(result.data);
            processLeaves(result.data);
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'İzin bilgileri alınamadı.');
        } finally {
            setLoading(false);
        }
    }, [profile?.companyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date('Invalid');
        // Handle DD.MM.YYYY format
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

    const processLeaves = (data: LeaveRequest[]) => {
        const marked: any = {};
        console.log('Processing leaves count:', data.length);

        data.forEach(leave => {
            let start = parseDate(leave.startDate);
            const end = parseDate(leave.endDate);

            console.log(`Leave: ${leave.userName}, Start: ${leave.startDate}, End: ${leave.endDate}`);
            console.log(`Parsed: Start: ${start}, End: ${end}`);

            // Safety check
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.log('Invalid date parsed for leave:', leave.id);
                return;
            }

            while (start <= end) {
                const dateStr = start.toISOString().split('T')[0];

                if (!marked[dateStr]) {
                    marked[dateStr] = { dots: [] };
                }

                // Add dot for this leave
                // Limit to 3 dots per day to avoid UI overflow
                if (marked[dateStr].dots.length < 3) {
                    let dotColor = Colors.primary;
                    if (leave.type === 'hastalik') dotColor = Colors.danger;
                    if (leave.type === 'ucretsiz') dotColor = Colors.warning;

                    marked[dateStr].dots.push({
                        key: leave.id,
                        color: dotColor,
                        selectedDotColor: dotColor,
                    });
                }

                start.setDate(start.getDate() + 1);
            }
        });

        setMarkedDates(marked);
        updateSelectedDayLeaves(selectedDate, data);
    };

    const updateSelectedDayLeaves = (date: string, allLeaves: LeaveRequest[]) => {
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        console.log('Target date for selection:', target);

        const onLeave = allLeaves.filter(l => {
            const start = parseDate(l.startDate);
            const end = parseDate(l.endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0); // Include end date

            const isInside = target >= start && target <= end;
            if (isInside) console.log(`Leave for ${l.userName} is inside selected date.`);
            return isInside;
        });

        setDayLeaves(onLeave);
    };

    const onDayPress = (day: any) => {
        setSelectedDate(day.dateString);
        updateSelectedDayLeaves(day.dateString, leaves);
    };

    if (loading) return <LoadingSpinner message="Takvim hazırlanıyor..." />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Şirket Takvimi</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Calendar
                    current={selectedDate}
                    onDayPress={onDayPress}
                    markedDates={{
                        ...markedDates,
                        [selectedDate]: {
                            ...(markedDates[selectedDate] || {}),
                            selected: true,
                            selectedColor: Colors.primary + '30', // Transparent selection
                            selectedTextColor: colors.text,
                        }
                    }}
                    theme={{
                        backgroundColor: colors.surface,
                        calendarBackground: colors.surface,
                        textSectionTitleColor: colors.textSecondary,
                        selectedDayBackgroundColor: Colors.primary,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: Colors.primary,
                        dayTextColor: colors.text,
                        textDisabledColor: colors.textTertiary,
                        dotColor: Colors.primary,
                        selectedDotColor: '#ffffff',
                        arrowColor: Colors.primary,
                        monthTextColor: colors.text,
                        indicatorColor: Colors.primary,
                        textDayFontWeight: '400',
                        textMonthFontWeight: '700',
                        textDayHeaderFontWeight: '500',
                        textDayFontSize: 14,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 13
                    }}
                    style={{
                        borderRadius: BorderRadius.lg,
                        ...Shadows.small,
                        marginBottom: Spacing.lg,
                    }}
                />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {format(new Date(selectedDate), 'd MMMM yyyy, EEEE', { locale: tr })}
                </Text>

                <FlatList
                    data={dayLeaves}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} style={{ opacity: 0.5 }} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Bugün izinli personel yok.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.leaveCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                            <View style={[styles.avatar, { backgroundColor: Colors.primary + '15' }]}>
                                <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                                    {item.userName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
                                <Text style={[styles.leaveType, { color: colors.textSecondary }]}>
                                    {getLeaveTypeLabel(item.type)} • {item.description || 'Açıklama yok'}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: Colors.success + '15' }]}>
                                <Text style={[styles.statusText, { color: Colors.success }]}>İzinli</Text>
                            </View>
                        </View>
                    )}
                />
            </View>
        </View>
    );
}

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
    backBtn: {
        width: 40, height: 40,
        justifyContent: 'center', alignItems: 'center',
        borderRadius: 20,
    },
    headerTitle: { ...Typography.h4 },
    content: { flex: 1, padding: Spacing.xl },
    sectionTitle: { ...Typography.h4, marginBottom: Spacing.md },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyText: { fontSize: 14 },
    leaveCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        gap: 12,
    },
    avatar: {
        width: 40, height: 40,
        borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    userName: { fontWeight: '600', fontSize: 15 },
    leaveType: { fontSize: 13 },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: { fontSize: 11, fontWeight: '600' },
});
