import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
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
    getUserLeaves,
    getCompanyLeaves,
    LeaveRequest,
    getLeaveTypeLabel,
    LeaveFilter,
} from '../../services/leaveService';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface LeaveListScreenProps {
    onNavigateDetail: (leaveId: string) => void;
    onNavigateCreate: () => void;
    onBack: () => void;
}

export function LeaveListScreen({ onNavigateDetail, onNavigateCreate, onBack }: LeaveListScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState<LeaveFilter>({
        status: 'all',
        startDate: undefined,
        endDate: undefined,
    });

    const isManager = profile?.role === 'admin' || profile?.role === 'idari';
    const LIMIT = 20;

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
            const result = isManager
                ? await getCompanyLeaves(profile.companyId, LIMIT, currentLastDoc, filters)
                : await getUserLeaves(profile.uid, profile.companyId, LIMIT, currentLastDoc, filters);

            if (loadMore) {
                setLeaves((prev) => [...prev, ...result.data]);
            } else {
                setLeaves(result.data);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.data.length === LIMIT);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [profile, isManager, filters, lastDoc, loadingMore]);

    useEffect(() => { loadData(false); }, [filters]);

    const onRefresh = async () => {
        setRefreshing(true);
        setLastDoc(null);

        const fetchRefresh = async () => {
            if (!profile) return;
            try {
                const result = isManager
                    ? await getCompanyLeaves(profile.companyId, LIMIT, null, filters)
                    : await getUserLeaves(profile.uid, profile.companyId, LIMIT, null, filters);
                setLeaves(result.data);
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
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {isManager ? 'Tüm İzinler' : 'İzinlerim'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {leaves.length} kayıt
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterBtn}>
                    <Ionicons name="options-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onNavigateCreate} style={styles.addBtn}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
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
                data={leaves}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    !loading ? (
                        <EmptyState
                            icon="calendar-outline"
                            title="İzin Bulunamadı"
                            message="Henüz izin talebi yok."
                        />
                    ) : (
                        <LoadingSpinner message="Yükleniyor..." />
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                        onPress={() => onNavigateDetail(item.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardTop}>
                            <View style={styles.cardLeft}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {getLeaveTypeLabel(item.type)}
                                </Text>
                                {isManager && (
                                    <Text style={[styles.cardUser, { color: Colors.primary }]}>{item.userName}</Text>
                                )}
                            </View>
                            <StatusBadge status={item.status} />
                        </View>
                        <View style={styles.cardBottom}>
                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                                    {item.startDate} → {item.endDate}
                                </Text>
                            </View>
                            {item.description ? (
                                <Text style={[styles.desc, { color: colors.textTertiary }]} numberOfLines={1}>
                                    {item.description}
                                </Text>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                )}
            />

            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                onApply={applyFilters}
                initialFilters={filters as any}
                type="leave"
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
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    cardLeft: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    cardUser: { fontSize: 13, fontWeight: '500', marginTop: 2 },
    cardBottom: { gap: 4 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 13 },
    desc: { fontSize: 12, marginTop: 2 },
});
