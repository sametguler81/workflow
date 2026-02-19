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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getUserInvoices,
    getCompanyInvoices,
    deleteInvoice,
    Invoice,
    InvoiceFilter,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_TYPE_ICONS,
} from '../../services/invoiceService';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface InvoiceListScreenProps {
    onNavigateDetail: (invoiceId: string) => void;
    onNavigateCreate: () => void;
    onBack: () => void;
    showHeader?: boolean;
}

export function InvoiceListScreen({ onNavigateDetail, onNavigateCreate, onBack, showHeader = true }: InvoiceListScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const isAdmin = profile?.role === 'idari' || profile?.role === 'admin' || profile?.role === 'muhasebe';

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState<InvoiceFilter>({});
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const lastDocRef = useRef<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);

    const fetchInvoices = useCallback(
        async (isRefresh = false, currentFilter?: InvoiceFilter) => {
            if (!profile) return;
            const f = currentFilter || filter;
            try {
                const result = isAdmin
                    ? await getCompanyInvoices(profile.companyId, 20, isRefresh ? null : lastDocRef.current, f)
                    : await getUserInvoices(profile.uid, profile.companyId, 20, isRefresh ? null : lastDocRef.current, f);

                if (isRefresh) {
                    setInvoices(result.data);
                } else {
                    setInvoices((prev) => {
                        const existingIds = new Set(prev.map(i => i.id));
                        const newInvoices = result.data.filter(i => !existingIds.has(i.id));
                        return [...prev, ...newInvoices];
                    });
                }
                lastDocRef.current = result.lastDoc;
                setHasMore(result.data.length === 20);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        [profile, filter, isAdmin]
    );

    useEffect(() => {
        fetchInvoices(true);
    }, [fetchInvoices]);

    const onRefresh = async () => {
        setRefreshing(true);
        const fetchRefresh = async () => {
            if (!profile) return;
            try {
                const result = isAdmin
                    ? await getCompanyInvoices(profile.companyId, 20, null, filter)
                    : await getUserInvoices(profile.uid, profile.companyId, 20, null, filter);
                setInvoices(result.data);
                lastDocRef.current = result.lastDoc;
                setHasMore(result.data.length === 20);
            } catch (err) {
                console.error(err);
            }
        };
        await fetchRefresh();
        setRefreshing(false);
    };

    const onLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            fetchInvoices(false).then(() => setLoadingMore(false));
        }
    };

    const applyTab = (tab: typeof activeTab) => {
        setActiveTab(tab);
        const newFilter = { ...filter, status: tab === 'all' ? ('all' as const) : tab };
        setFilter(newFilter);
        setLoading(true);
        lastDocRef.current = null;
        fetchInvoices(true, newFilter);
    };

    const handleDelete = (invoice: Invoice) => {
        Alert.alert('Sil', 'Bu belgeyi silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteInvoice(invoice.id);
                        setInvoices((prev) => prev.filter((i) => i.id !== invoice.id));
                    } catch (err) {
                        Alert.alert('Hata', 'Belge silinemedi.');
                    }
                },
            },
        ]);
    };

    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>, invoice: Invoice) => {
        const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
        return (
            <Animated.View style={[styles.deleteAction, { transform: [{ scale }] }]}>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(invoice)}>
                    <Ionicons name="trash" size={22} color="#FFF" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={Colors.primary} />
            </View>
        );
    };

    const tabs: { key: typeof activeTab; label: string }[] = [
        { key: 'all', label: 'Tümü' },
        { key: 'pending', label: 'Bekleyen' },
        { key: 'approved', label: 'Onaylı' },
        { key: 'rejected', label: 'Red' },
    ];

    const renderItem = ({ item }: { item: Invoice }) => (
        <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item)}>
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                onPress={() => onNavigateDetail(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.cardLeft}>
                    <View style={[styles.typeIcon, { backgroundColor: Colors.primary + '12' }]}>
                        <Ionicons
                            name={DOCUMENT_TYPE_ICONS[item.documentType] as any}
                            size={20}
                            color={Colors.primary}
                        />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                            {DOCUMENT_TYPE_LABELS[item.documentType]}
                            {isAdmin ? ` • ${item.userName}` : ''}
                        </Text>
                        <Text style={[styles.cardDesc, { color: colors.textTertiary }]} numberOfLines={1}>
                            {item.description || 'Açıklama yok'} • {item.date}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardRight}>
                    <Text style={[styles.cardAmount, { color: colors.text }]}>₺{item.amount.toFixed(2)}</Text>
                    <StatusBadge status={item.status} size="sm" />
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            {showHeader && (
                <LinearGradient
                    colors={Colors.gradientPrimary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Belgeler</Text>
                        <TouchableOpacity onPress={onNavigateCreate} style={styles.headerBtn}>
                            <Ionicons name="add-circle" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
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

            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Belge bulunamadı</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 20,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
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
    tabText: { fontSize: 13 },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        ...Shadows.small,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    cardDesc: { fontSize: 12 },
    cardRight: { alignItems: 'flex-end', gap: 4 },
    cardAmount: { fontSize: 15, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
    emptyText: { fontSize: 14, fontWeight: '500' },
    deleteAction: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingLeft: 20,
    },
    deleteBtn: {
        backgroundColor: Colors.danger,
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
