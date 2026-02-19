import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getAllCompanies, CompanyWithStats, PLAN_DETAILS } from '../../services/superAdminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminCompanyListScreenProps {
    onBack: () => void;
    onNavigateDetail: (companyId: string) => void;
}

type PlanFilter = 'all' | 'free' | 'pro' | 'enterprise';

export function AdminCompanyListScreen({ onBack, onNavigateDetail }: AdminCompanyListScreenProps) {
    const { colors } = useTheme();
    const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
    const [filtered, setFiltered] = useState<CompanyWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState<PlanFilter>('all');

    const fetchCompanies = useCallback(async () => {
        try {
            const data = await getAllCompanies();
            setCompanies(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    useEffect(() => {
        let result = [...companies];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.ownerName?.toLowerCase().includes(q) ||
                c.ownerEmail?.toLowerCase().includes(q)
            );
        }
        if (planFilter !== 'all') {
            result = result.filter(c => c.plan === planFilter);
        }
        setFiltered(result);
    }, [companies, search, planFilter]);

    const onRefresh = () => { setRefreshing(true); fetchCompanies(); };

    const planColors: Record<string, string> = {
        free: '#64748B',
        pro: '#3B82F6',
        enterprise: '#8B5CF6',
    };
    const planLabels: Record<string, string> = {
        free: 'Ücretsiz',
        pro: 'Pro',
        enterprise: 'Kurumsal',
    };

    if (loading) return <LoadingSpinner message="Firmalar yükleniyor..." />;

    const renderCompany = ({ item }: { item: CompanyWithStats }) => (
        <TouchableOpacity
            style={[styles.companyCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
            onPress={() => onNavigateDetail(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.companyHeader}>
                <View style={[styles.companyIcon, { backgroundColor: planColors[item.plan] + '15' }]}>
                    <Ionicons name="business" size={22} color={planColors[item.plan]} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.companyName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.companyOwner, { color: colors.textTertiary }]}>
                        {item.ownerName} • {item.ownerEmail}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>

            <View style={styles.companyMeta}>
                <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.memberCount || 0} üye</Text>
                </View>
                <View style={[styles.planTag, { backgroundColor: planColors[item.plan] + '15' }]}>
                    <Text style={[styles.planTagText, { color: planColors[item.plan] }]}>
                        {planLabels[item.plan] || item.plan}
                    </Text>
                </View>
                <Text style={[styles.metaDate, { color: colors.textTertiary }]}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#0F172A', '#1E293B'] as any}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Firmalar</Text>
                    <Text style={styles.headerCount}>{companies.length} firma</Text>
                </View>

                {/* Search */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Firma ara..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Plan Filter */}
                <View style={styles.filterRow}>
                    {(['all', 'free', 'pro', 'enterprise'] as PlanFilter[]).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, planFilter === f && styles.filterChipActive]}
                            onPress={() => setPlanFilter(f)}
                        >
                            <Text style={[styles.filterText, planFilter === f && styles.filterTextActive]}>
                                {f === 'all' ? 'Tümü' : planLabels[f]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderCompany}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Ionicons name="business-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                            {search ? 'Sonuç bulunamadı' : 'Henüz firma yok'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
    },
    headerCount: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#FFF',
        padding: 0,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    filterChipActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
    },
    filterTextActive: {
        color: '#FFF',
    },
    list: {
        padding: Spacing.xl,
        paddingBottom: 100,
    },
    companyCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: 10,
        ...Shadows.small,
    },
    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    companyIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    companyOwner: {
        fontSize: 12,
    },
    companyMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    planTag: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    planTagText: {
        fontSize: 11,
        fontWeight: '700',
    },
    metaDate: {
        fontSize: 11,
        marginLeft: 'auto',
    },
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
    },
});
