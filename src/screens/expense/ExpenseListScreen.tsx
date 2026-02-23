import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FilterModal } from '../../components/FilterModal';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import {
    getUserExpenses,
    getCompanyExpenses,
    deleteExpense,
    Expense,
    ExpenseFilter,
} from '../../services/expenseService';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface ExpenseListScreenProps {
    onNavigateDetail: (expenseId: string) => void;
    onNavigateCreate: () => void;
    onBack: () => void;
    showHeader?: boolean;
}

export function ExpenseListScreen({ onNavigateDetail, onNavigateCreate, onBack, showHeader = true }: ExpenseListScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [filters, setFilters] = useState<ExpenseFilter>({
        status: 'all',
        startDate: undefined,
        endDate: undefined,
    });

    const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
    const isReviewer = profile?.role === 'admin' || profile?.role === 'muhasebe' || profile?.role === 'idari';
    const LIMIT = 10;

    const loadData = useCallback(async (loadMore = false) => {
        if (!profile) return;
        if (loadingMore) return;

        try {
            if (loadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const currentLastDoc = loadMore ? lastDoc : null;

            const result = isReviewer
                ? await getCompanyExpenses(profile.companyId, LIMIT, currentLastDoc, filters)
                : await getUserExpenses(profile.uid, profile.companyId, LIMIT, currentLastDoc, filters);

            if (loadMore) {
                setExpenses((prev) => {
                    const existingIds = new Set(prev.map(e => e.id));
                    const newExpenses = result.data.filter(e => !existingIds.has(e.id));
                    return [...prev, ...newExpenses];
                });
            } else {
                setExpenses(result.data);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.data.length === LIMIT);
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'Fişler yüklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [profile, isReviewer, filters, lastDoc, loadingMore]);

    // Initial load and filter change
    useEffect(() => {
        loadData(false);
    }, [filters]);

    const onRefresh = () => {
        setRefreshing(true);
        setLastDoc(null);

        const fetchRefresh = async () => {
            if (!profile) return;
            try {
                const result = isReviewer
                    ? await getCompanyExpenses(profile.companyId, LIMIT, null, filters)
                    : await getUserExpenses(profile.uid, profile.companyId, LIMIT, null, filters);
                setExpenses(result.data);
                setLastDoc(result.lastDoc);
                setHasMore(result.data.length === LIMIT);
            } catch (error) {
                console.error(error);
            } finally {
                setRefreshing(false);
            }
        };
        fetchRefresh();
    };

    const onLoadMore = () => {
        if (!hasMore || loadingMore || loading) return;
        loadData(true);
    };

    const applyFilters = (newFilters: any) => {
        setFilters(newFilters);
        setLastDoc(null);
        setHasMore(true);
        // If status changes in modal, update tab too if it matches one of the known tabs
        if (newFilters.status && ['all', 'pending', 'approved', 'rejected'].includes(newFilters.status)) {
            setActiveTab(newFilters.status);
        }
    };

    const applyTab = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setFilters((prev) => ({ ...prev, status: tab === 'all' ? 'all' : tab }));
        setLastDoc(null);
        setHasMore(true);
    };

    const tabs: { key: typeof activeTab; label: string }[] = [
        { key: 'all', label: 'Tümü' },
        { key: 'pending', label: 'Bekleyen' },
        { key: 'approved', label: 'Onaylı' },
        { key: 'rejected', label: 'Red' },
    ];

    const handleDelete = (expense: Expense) => {
        const ref = swipeableRefs.current.get(expense.id);
        ref?.close();

        Alert.alert(
            'Fişi Sil',
            `"${expense.description || 'Fiş/Fatura'}" (₺${expense.amount.toFixed(2)}) silmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteExpense(expense.id);
                            setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
                            Alert.alert('Başarılı', 'Fiş silindi ✅');
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Hata', 'Fiş silinemedi.');
                        }
                    },
                },
            ]
        );
    };

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>, expense: Expense) => {
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });
        return (
            <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(expense)}>
                    <Ionicons name="trash-outline" size={22} color="#FFF" />
                    <Text style={styles.deleteText}>Sil</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {showHeader && (
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {isReviewer ? 'Tüm Fişler' : 'Fişlerim'}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {expenses.length} kayıt
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterBtn}>
                        <Ionicons name="options-outline" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onNavigateCreate} style={styles.addBtn}>
                        <Ionicons name="add-circle" size={28} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Tabs */}
            <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tab,
                            activeTab === tab.key && { borderBottomColor: Colors.primary, borderBottomWidth: 2 },
                        ]}
                        onPress={() => applyTab(tab.key)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                {
                                    color: activeTab === tab.key ? Colors.primary : colors.textTertiary,
                                    fontWeight: activeTab === tab.key ? '700' : '500',
                                },
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Active Filters Summary */}
            {(filters.status !== 'all' || filters.startDate) && (
                <View style={[styles.activeFilters, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.activeFilterText, { color: colors.textSecondary }]}>
                        Filtre:
                        {filters.status !== 'all' && ` ${filters.status === 'pending' ? 'Bekleyen' : filters.status === 'approved' ? 'Onaylı' : 'Red'}`}
                        {filters.startDate && `, ${format(filters.startDate, 'dd.MM')} - ${filters.endDate ? format(filters.endDate, 'dd.MM') : '...'}`}
                    </Text>
                    <TouchableOpacity onPress={() => setFilters({ status: 'all' })}>
                        <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState icon="receipt-outline" title="Fiş Bulunamadı" message="Kriterlere uygun fiş yok." />
                    ) : (
                        <LoadingSpinner message="Yükleniyor..." />
                    )
                }
                renderItem={({ item }) => {
                    const canDelete = ['admin', 'idari', 'muhasebe'].includes(profile?.role || '');

                    if (!canDelete) {
                        return (
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                onPress={() => onNavigateDetail(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardContent}>
                                    <View style={[styles.amountBadge, { backgroundColor: Colors.primary + '15' }]}>
                                        <Text style={styles.amountText}>₺{item.amount.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                                            {item.description || 'Fiş/Fatura'}
                                        </Text>
                                        <Text style={[styles.cardSub, { color: colors.textTertiary }]}>
                                            {item.userName} • {item.date}
                                        </Text>
                                    </View>
                                    <StatusBadge status={item.status} size="sm" />
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <Swipeable
                            ref={(ref) => { if (ref) swipeableRefs.current.set(item.id, ref); }}
                            renderRightActions={(p, d) => renderRightActions(p, d, item)}
                            overshootRight={false}
                        >
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                onPress={() => onNavigateDetail(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardContent}>
                                    <View style={[styles.amountBadge, { backgroundColor: Colors.primary + '15' }]}>
                                        <Text style={styles.amountText}>₺{item.amount.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                                            {item.description || 'Fiş/Fatura'}
                                        </Text>
                                        <Text style={[styles.cardSub, { color: colors.textTertiary }]}>
                                            {item.userName} • {item.date}
                                        </Text>
                                    </View>
                                    <StatusBadge status={item.status} size="sm" />
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    );
                }}
            />

            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApply={applyFilters}
                initialFilters={filters as any}
                type="expense"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    filterBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    activeFilters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: 8,
    },
    activeFilterText: { fontSize: 12, fontWeight: '500' },
    list: { paddingHorizontal: Spacing.xl, paddingBottom: 30, paddingTop: Spacing.md },
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    amountBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
    },
    amountText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '800',
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardSub: { fontSize: 12, marginTop: 4 },
    deleteAction: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: Colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        height: '100%',
        borderRadius: BorderRadius.lg,
        gap: 4,
    },
    deleteText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: Spacing.md,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    tabText: {
        fontSize: 13,
    },
});
