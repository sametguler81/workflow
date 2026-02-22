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
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getUserAssignments,
    Assignment,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
} from '../../services/inventoryService';

interface MyAssignmentsScreenProps {
    onBack: () => void;
}

export function MyAssignmentsScreen({ onBack }: MyAssignmentsScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const data = await getUserAssignments(profile.uid, profile.companyId);
            setAssignments(data);
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

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        } catch { return iso; }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Zimmetlerim</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Summary */}
                <View style={[styles.summaryCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}>
                    <View style={[styles.summaryIconBox, { backgroundColor: Colors.primary + '20' }]}>
                        <Ionicons name="cube-outline" size={24} color={Colors.primary} />
                    </View>
                    <View>
                        <Text style={[styles.summaryCount, { color: Colors.primary }]}>
                            {assignments.length} Ürün
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                            Üzerinizde kayıtlı zimmet
                        </Text>
                    </View>
                </View>

                {/* Assignments */}
                {assignments.map(assignment => (
                    <View
                        key={assignment.id}
                        style={[styles.assignmentCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    >
                        <View style={[styles.itemIcon, { backgroundColor: Colors.primary + '10' }]}>
                            <Ionicons
                                name={CATEGORY_ICONS[assignment.itemCategory] as any}
                                size={22}
                                color={Colors.primary}
                            />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.itemName, { color: colors.text }]}>
                                {assignment.itemName}
                            </Text>
                            <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                                {CATEGORY_LABELS[assignment.itemCategory]}
                            </Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                                    {formatDate(assignment.assignedAt)} tarihinden beri
                                </Text>
                            </View>
                            {assignment.notes ? (
                                <View style={styles.metaRow}>
                                    <Ionicons name="document-text-outline" size={12} color={colors.textTertiary} />
                                    <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                                        {assignment.notes}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        <View style={[styles.activeBadge, { backgroundColor: Colors.primary + '15' }]}>
                            <Text style={[styles.activeBadgeText, { color: Colors.primary }]}>Aktif</Text>
                        </View>
                    </View>
                ))}

                {assignments.length === 0 && (
                    <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                        <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Zimmet Yok</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            Şu an üzerinizde kayıtlı herhangi bir ekipman bulunmuyor.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    summaryIconBox: {
        width: 48, height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCount: { fontSize: 22, fontWeight: '800' },
    summaryLabel: { fontSize: 13, marginTop: 2 },
    assignmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadows.small,
    },
    itemIcon: {
        width: 44, height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    cardContent: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700' },
    itemCategory: { fontSize: 12, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    metaText: { fontSize: 11 },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    activeBadgeText: { fontSize: 11, fontWeight: '700' },
    emptyCard: {
        padding: Spacing.xxxl,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        borderStyle: 'dashed',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
