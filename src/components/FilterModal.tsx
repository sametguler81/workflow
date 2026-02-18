import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme/theme';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
    initialFilters: {
        status: string;
        startDate?: Date;
        endDate?: Date;
    };
    type: 'expense' | 'leave';
}

export function FilterModal({
    visible,
    onClose,
    onApply,
    initialFilters,
    type,
}: FilterModalProps) {
    const { colors, isDark } = useTheme();
    const [status, setStatus] = useState(initialFilters.status);
    const [startDate, setStartDate] = useState<Date | undefined>(initialFilters.startDate);
    const [endDate, setEndDate] = useState<Date | undefined>(initialFilters.endDate);

    // Date picker visibility
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (visible) {
            setStatus(initialFilters.status);
            setStartDate(initialFilters.startDate);
            setEndDate(initialFilters.endDate);
        }
    }, [visible, initialFilters]);

    const handleApply = () => {
        onApply({ status, startDate, endDate });
        onClose();
    };

    const handleClear = () => {
        setStatus('all');
        setStartDate(undefined);
        setEndDate(undefined);
    };

    const onDateChange = (event: any, selectedDate?: Date, isStart?: boolean) => {
        if (isStart) setShowStartPicker(false);
        else setShowEndPicker(false);

        if (selectedDate) {
            if (isStart) {
                setStartDate(selectedDate);
                // If end date is before new start date, clear it
                if (endDate && selectedDate > endDate) {
                    setEndDate(undefined);
                }
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    const statusOptions = [
        { key: 'all', label: 'Tümü' },
        { key: 'pending', label: 'Bekleyen' },
        { key: 'approved', label: 'Onaylı' },
        { key: 'rejected', label: 'Reddedildi' },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Filtrele</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Status Filter */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Durum</Text>
                        <View style={styles.chipContainer}>
                            {statusOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: status === opt.key ? Colors.primary : colors.surfaceVariant,
                                            borderColor: status === opt.key ? Colors.primary : colors.border,
                                        },
                                    ]}
                                    onPress={() => setStatus(opt.key)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: status === opt.key ? '#FFF' : colors.text },
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date Range Filter */}
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>Tarih Aralığı</Text>
                        <View style={styles.dateRow}>
                            <View style={styles.dateCol}>
                                <Text style={[styles.label, { color: colors.textTertiary }]}>Başlangıç</Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => setShowStartPicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                                    <Text style={[styles.dateText, { color: startDate ? colors.text : colors.textTertiary }]}>
                                        {startDate ? format(startDate, 'dd MMM yyyy', { locale: tr }) : 'Seçiniz'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateCol}>
                                <Text style={[styles.label, { color: colors.textTertiary }]}>Bitiş</Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => setShowEndPicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                                    <Text style={[styles.dateText, { color: endDate ? colors.text : colors.textTertiary }]}>
                                        {endDate ? format(endDate, 'dd MMM yyyy', { locale: tr }) : 'Seçiniz'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {(showStartPicker || showEndPicker) && (
                            <DateTimePicker
                                value={showStartPicker ? (startDate || new Date()) : (endDate || new Date())}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(e, date) => onDateChange(e, date, showStartPicker)}
                                maximumDate={new Date()}
                                minimumDate={showEndPicker ? startDate : undefined}
                            />
                        )}
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.resetButton, { borderColor: colors.border }]}
                            onPress={handleClear}
                        >
                            <Text style={[styles.resetText, { color: colors.text }]}>Temizle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.applyButton, { backgroundColor: Colors.primary }]}
                            onPress={handleApply}
                        >
                            <Text style={styles.applyText}>Uygula</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '80%',
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    dateRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    dateCol: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    dateText: {
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        borderTopWidth: 1,
        marginTop: Spacing.lg,
    },
    resetButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
    },
    resetText: {
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    applyText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
