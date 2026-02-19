import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme/theme';
import { getAllCompanies, CompanyWithStats, PLAN_DETAILS } from '../../services/superAdminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminSubscriptionScreenProps {
    onBack: () => void;
    onNavigateCompanyDetail: (companyId: string) => void;
}

export function AdminSubscriptionScreen({ onBack, onNavigateCompanyDetail }: AdminSubscriptionScreenProps) {
    const { colors } = useTheme();
    const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
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

    useEffect(() => { fetchData(); }, [fetchData]);
    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const openPlanModal = (planKey: string) => {
        setSelectedPlanModal(planKey);
    };

    const closePlanModal = () => {
        setSelectedPlanModal(null);
    };

    if (loading) return <LoadingSpinner message="Yükleniyor..." />;

    const planGroups = {
        free: companies.filter(c => c.plan === 'free'),
        pro: companies.filter(c => c.plan === 'pro'),
        enterprise: companies.filter(c => c.plan === 'enterprise'),
    };

    const totalRevenue =
        planGroups.pro.length * PLAN_DETAILS.pro.price +
        planGroups.enterprise.length * PLAN_DETAILS.enterprise.price;

    const renderCompanyItem = ({ item }: { item: CompanyWithStats }) => (
        <TouchableOpacity
            style={[styles.companyRow, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
            onPress={() => {
                closePlanModal();
                onNavigateCompanyDetail(item.id);
            }}
        >
            <View style={[styles.companyIcon, { backgroundColor: PLAN_DETAILS[item.plan].color + '15' }]}>
                <Ionicons name="business" size={16} color={PLAN_DETAILS[item.plan].color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.companyName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.companySub, { color: colors.textTertiary }]}>
                    {item.memberCount || 0} üye • {item.ownerName}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Header */}
                <LinearGradient colors={['#0F172A', '#1E293B'] as any} style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Abonelikler</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Revenue Card */}
                    <View style={styles.revenueCard}>
                        <Text style={styles.revenueLabel}>Tahmini Aylık Gelir</Text>
                        <Text style={styles.revenueValue}>
                            ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </Text>
                        <Text style={styles.revenueDetail}>
                            {companies.length} firma • {planGroups.pro.length + planGroups.enterprise.length} ücretli
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Plan Overview Cards */}
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Dağılımı</Text>
                    <View style={styles.planGrid}>
                        {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map(key => {
                            const plan = PLAN_DETAILS[key];
                            const count = planGroups[key].length;
                            const pct = companies.length > 0 ? Math.round((count / companies.length) * 100) : 0;
                            return (
                                <View key={key} style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                                    <View style={[styles.planDot, { backgroundColor: plan.color }]} />
                                    <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                                    <Text style={[styles.planCount, { color: colors.text }]}>{count}</Text>
                                    <Text style={[styles.planPct, { color: colors.textTertiary }]}>{pct}%</Text>
                                    <Text style={[styles.planPriceSmall, { color: colors.textSecondary }]}>
                                        {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price}/ay`}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Plan Details */}
                    {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map(key => {
                        const plan = PLAN_DETAILS[key];
                        const items = planGroups[key];
                        return (
                            <View key={key} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionDot, { backgroundColor: plan.color }]} />
                                    <Text style={[styles.sectionName, { color: colors.text }]}>
                                        {plan.name} ({items.length})
                                    </Text>
                                    <Text style={[styles.sectionPrice, { color: plan.color }]}>
                                        {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price}/ay`}
                                    </Text>
                                </View>

                                {/* Features */}
                                <View style={styles.featuresWrap}>
                                    {plan.features.slice(0, 3).map((f, i) => (
                                        <View key={i} style={styles.featureRow}>
                                            <Ionicons name="checkmark-circle" size={14} color={plan.color} />
                                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
                                        </View>
                                    ))}
                                    {plan.features.length > 3 && (
                                        <Text style={{ fontSize: 11, color: colors.textTertiary, marginLeft: 20 }}>+ {plan.features.length - 3} özellik daha</Text>
                                    )}
                                </View>

                                {/* Action Button */}
                                <TouchableOpacity
                                    style={[styles.viewBtn, { backgroundColor: plan.color + '15' }]}
                                    onPress={() => openPlanModal(key)}
                                >
                                    <Text style={[styles.viewBtnText, { color: plan.color }]}>Aboneleri Görüntüle ({items.length})</Text>
                                    <Ionicons name="list" size={16} color={plan.color} />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Subscribers Modal */}
            {selectedPlanModal && (
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.planDot, { backgroundColor: PLAN_DETAILS[selectedPlanModal as keyof typeof PLAN_DETAILS].color }]} />
                                <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>
                                    {PLAN_DETAILS[selectedPlanModal as keyof typeof PLAN_DETAILS].name} Aboneleri
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closePlanModal}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={planGroups[selectedPlanModal as keyof typeof planGroups]}
                            keyExtractor={item => item.id}
                            renderItem={renderCompanyItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Bu planda firma bulunmuyor.</Text>
                            }
                        />

                        <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
                            <TouchableOpacity
                                style={[styles.modalFooterBtn, { backgroundColor: colors.surfaceVariant }]}
                                onPress={closePlanModal}
                            >
                                <Text style={{ color: colors.text }}>Kapat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: Spacing.xl },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    revenueCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    revenueLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 4 },
    revenueValue: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    revenueDetail: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    content: { padding: Spacing.xl, paddingBottom: 100 },
    sectionTitle: { ...Typography.h4, marginBottom: Spacing.md },
    planGrid: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xxl },
    planCard: {
        flex: 1, borderRadius: BorderRadius.lg, borderWidth: 1,
        padding: Spacing.md, alignItems: 'center', ...Shadows.small,
    },
    planDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
    planName: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    planCount: { fontSize: 22, fontWeight: '800' },
    planPct: { fontSize: 11, marginBottom: 4 },
    planPriceSmall: { fontSize: 10, fontWeight: '600' },
    section: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.small,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionDot: { width: 10, height: 10, borderRadius: 5 },
    sectionName: { flex: 1, fontSize: 16, fontWeight: '700' },
    sectionPrice: { fontSize: 14, fontWeight: '700' },
    featuresWrap: { marginBottom: 12, gap: 6 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    featureText: { fontSize: 12, fontWeight: '500' },
    companyRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, gap: 10,
    },
    companyIcon: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    companyName: { fontSize: 14, fontWeight: '600', marginBottom: 1 },
    companySub: { fontSize: 11 },
    emptyText: { textAlign: 'center', paddingVertical: 16, fontSize: 13 },
    viewBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 12, borderRadius: 10, marginTop: 10,
    },
    viewBtnText: {
        fontWeight: '700', fontSize: 13,
    },
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center', zIndex: 100,
    },
    modalCard: {
        width: '90%', padding: 20, borderRadius: 24, ...Shadows.large, elevation: 10,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalFooter: {
        flexDirection: 'row', justifyContent: 'center',
        marginTop: 20, paddingTop: 16, borderTopWidth: 1,
    },
    modalFooterBtn: {
        paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
});
