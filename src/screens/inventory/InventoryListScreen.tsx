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
    getInventoryItems,
    InventoryItem,
    ItemCategory,
    ItemStatus,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
    STATUS_LABELS,
    STATUS_COLORS,
} from '../../services/inventoryService';

interface InventoryListScreenProps {
    onBack: () => void;
    onNavigateDetail: (itemId: string) => void;
    onNavigateAdd: () => void;
}

const STATUS_FILTERS: { key: ItemStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'available', label: 'Müsait' },
    { key: 'assigned', label: 'Zimmetli' },
    { key: 'maintenance', label: 'Bakımda' },
    { key: 'retired', label: 'Dışı' },
];

export function InventoryListScreen({
    onBack,
    onNavigateDetail,
    onNavigateAdd,
}: InventoryListScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filter, setFilter] = useState<ItemStatus | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const data = await getInventoryItems(profile.companyId);
            setItems(data);
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

    const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

    const stats = {
        total: items.length,
        available: items.filter(i => i.status === 'available').length,
        assigned: items.filter(i => i.status === 'assigned').length,
        maintenance: items.filter(i => i.status === 'maintenance').length,
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Envanter</Text>
                <TouchableOpacity onPress={onNavigateAdd} style={styles.addBtn} activeOpacity={0.7}>
                    <Ionicons name="add" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statChip, { backgroundColor: Colors.primary + '15' }]}>
                        <Text style={[styles.statChipValue, { color: Colors.primary }]}>{stats.total}</Text>
                        <Text style={[styles.statChipLabel, { color: Colors.primary }]}>Toplam</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: STATUS_COLORS.available + '15' }]}>
                        <Text style={[styles.statChipValue, { color: STATUS_COLORS.available }]}>{stats.available}</Text>
                        <Text style={[styles.statChipLabel, { color: STATUS_COLORS.available }]}>Müsait</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: STATUS_COLORS.assigned + '15' }]}>
                        <Text style={[styles.statChipValue, { color: STATUS_COLORS.assigned }]}>{stats.assigned}</Text>
                        <Text style={[styles.statChipLabel, { color: STATUS_COLORS.assigned }]}>Zimmetli</Text>
                    </View>
                    <View style={[styles.statChip, { backgroundColor: STATUS_COLORS.maintenance + '15' }]}>
                        <Text style={[styles.statChipValue, { color: STATUS_COLORS.maintenance }]}>{stats.maintenance}</Text>
                        <Text style={[styles.statChipLabel, { color: STATUS_COLORS.maintenance }]}>Bakımda</Text>
                    </View>
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {STATUS_FILTERS.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: filter === f.key ? Colors.primary : colors.surface,
                                    borderColor: filter === f.key ? Colors.primary : colors.border,
                                },
                            ]}
                            onPress={() => setFilter(f.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.filterChipText, { color: filter === f.key ? '#FFF' : colors.textSecondary }]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Items List */}
                <View style={styles.listContainer}>
                    {filtered.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={() => onNavigateDetail(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.itemIconBox, { backgroundColor: Colors.primary + '10' }]}>
                                <Ionicons
                                    name={CATEGORY_ICONS[item.category] as any}
                                    size={22}
                                    color={Colors.primary}
                                />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                                    {CATEGORY_LABELS[item.category]}
                                    {item.attributes?.brand ? ` • ${item.attributes.brand}` : ''}
                                    {item.attributes?.model ? ` ${item.attributes.model}` : ''}
                                    {item.attributes?.plate ? ` • ${item.attributes.plate}` : ''}
                                </Text>
                                {(item.attributes?.serialNumber || item.attributes?.vin) ? (
                                    <Text style={[styles.itemSerial, { color: colors.textTertiary }]}>
                                        {item.attributes?.plate ? '' : `S/N: ${item.attributes?.serialNumber || item.attributes?.vin}`}
                                    </Text>
                                ) : null}
                            </View>
                            <View style={styles.itemRight}>
                                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '15' }]}>
                                    <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[item.status] }]}>
                                        {STATUS_LABELS[item.status]}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={{ marginTop: 6 }} />
                            </View>
                        </TouchableOpacity>
                    ))}

                    {filtered.length === 0 && (
                        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                            <Ionicons name="cube-outline" size={36} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {filter === 'all' ? 'Henüz envanter kaydı yok' : 'Bu filtrede ürün bulunamadı'}
                            </Text>
                            {filter === 'all' && (
                                <TouchableOpacity
                                    style={[styles.emptyAddBtn, { backgroundColor: Colors.primary }]}
                                    onPress={onNavigateAdd}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.emptyAddBtnText}>+ Ürün Ekle</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
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
    addBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        padding: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    statChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    statChipValue: { fontSize: 18, fontWeight: '800' },
    statChipLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
    filterRow: {
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    listContainer: { padding: Spacing.lg, paddingTop: Spacing.sm },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        ...Shadows.small,
    },
    itemIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    itemContent: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700' },
    itemMeta: { fontSize: 12, marginTop: 2 },
    itemSerial: { fontSize: 11, marginTop: 2 },
    itemRight: { alignItems: 'flex-end' },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    emptyCard: {
        padding: Spacing.xxxl,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        borderStyle: 'dashed',
        gap: Spacing.md,
    },
    emptyText: { fontSize: 14, textAlign: 'center' },
    emptyAddBtn: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    emptyAddBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
