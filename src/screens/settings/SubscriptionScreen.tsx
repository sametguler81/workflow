import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getCompany, Company } from '../../services/companyService';

const { width } = Dimensions.get('window');

interface SubscriptionScreenProps {
    onBack: () => void;
}

const PLAN_ORDER = ['free', 'pro', 'enterprise'];

const PLANS = [
    {
        id: 'free',
        name: 'Başlangıç',
        tag: 'FREE',
        price: '₺0',
        period: 'Sonsuza dek',
        userLimit: '5 Kullanıcı',
        storage: '5 GB Depolama',
        support: 'Temel E-posta Destek',
        features: ['İzin Yönetimi', 'Fiş/Fatura Yükleme', 'Temel Raporlar', 'QR Yoklama', 'Zimmet Yönetimi', 'Duyuru Sistemi'],
        missing: ['Özel Raporlar', 'AI Raporlama ve Destek', 'Geliştirilebilir Raporlar'],
        accent: '#64748B',
    },
    {
        id: 'pro',
        name: 'Profesyonel',
        tag: 'PRO',
        price: '₺499',
        period: 'Aylık',
        userLimit: '20 Kullanıcı',
        storage: '20 GB Depolama',
        support: '7/24 Öncelikli Destek',
        features: ['İzin Yönetimi', 'Fiş/Fatura Yükleme', 'Özel Raporlar', 'QR Yoklama', 'Zimmet Yönetimi', 'Duyuru Sistemi'],
        missing: ['AI Raporlama ve Destek', 'Geliştirilebilir Raporlar'],
        accent: '#1E40AF',
        recommended: true,
    },
    {
        id: 'enterprise',
        name: 'Kurumsal',
        tag: 'ENTERPRISE',
        price: 'Özel Fiyat',
        period: 'Teklif Alın',
        userLimit: 'Sınırsız Kullanıcı',
        storage: 'Sınırsız Depolama',
        support: 'Özel Müşteri Temsilcisi',
        features: ['İzin Yönetimi', 'AI Raporlama ve Destek', 'Fiş/Fatura Yükleme', 'Geliştirilebilir Raporlar', 'QR Yoklama', 'Zimmet Yönetimi', 'Duyuru Sistemi'],
        missing: [],
        accent: '#1A1A2E',
    },
];

const TRUST_ITEMS = [
    { icon: 'shield-checkmark-outline', label: 'SSL Şifrelemesi' },
    { icon: 'cloud-done-outline', label: 'KVKK Uyumlu' },
    { icon: 'lock-closed-outline', label: 'İzole Veri' },
    { icon: 'refresh-outline', label: '99.9% SLA' },
];

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
    const { profile } = useAuth();
    const { colors, isDark } = useTheme();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (profile?.companyId) {
                const data = await getCompany(profile.companyId);
                setCompany(data);
            }
            setLoading(false);
        };
        load();
    }, [profile]);

    const handleUpgrade = (planName: string) => {
        Alert.alert(
            'Yükseltme Talebi Alındı',
            `${planName} paketi için talebiniz iletildi. Temsilcimiz en kısa sürede sizinle iletişime geçecektir.`,
            [{ text: 'Tamam', style: 'default' }],
        );
    };

    const currentPlanId = company?.plan || 'free';
    const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* ── Header ── */}
            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                style={styles.header}
            >
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Abonelik Yönetimi</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* ── Company Plan Banner ── */}
                <LinearGradient
                    colors={['#1E3A8A', '#1E40AF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.companyBanner}
                >
                    <View>
                        <Text style={styles.bannerCompanyLabel}>Kurum</Text>
                        <Text style={styles.bannerCompanyName} numberOfLines={1}>
                            {company?.name || profile?.companyId || 'Şirketiniz'}
                        </Text>
                    </View>
                    <View style={styles.bannerRight}>
                        <View style={[styles.planPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="ribbon" size={14} color="#FFF" />
                            <Text style={styles.planPillText}>{currentPlan.tag}</Text>
                        </View>
                        <Text style={styles.bannerSince}>Aktif Plan</Text>
                    </View>
                </LinearGradient>

                {/* ── Trust Row ── */}
                <View style={[styles.trustRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    {TRUST_ITEMS.map((item) => (
                        <View key={item.label} style={styles.trustItem}>
                            <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                            <Text style={[styles.trustLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Section Label ── */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Abonelik Planları</Text>
                    <View style={[styles.sectionDivider, { backgroundColor: colors.borderLight }]} />
                </View>

                {/* ── Plan Cards ── */}
                {PLANS.map((plan) => {
                    const isCurrent = currentPlanId === plan.id;
                    const isUpgrade = PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(currentPlanId);

                    return (
                        <View
                            key={plan.id}
                            style={[
                                styles.card,
                                { backgroundColor: colors.card, borderColor: plan.recommended ? Colors.primary : colors.borderLight },
                                plan.recommended && { borderWidth: 2 },
                            ]}
                        >
                            {/* Recommended Banner */}
                            {plan.recommended && (
                                <View style={[styles.recommendedBar, { backgroundColor: Colors.primary }]}>
                                    <Ionicons name="star" size={11} color="#FFF" />
                                    <Text style={styles.recommendedBarText}>KURUMSAL KULLANICILARIN TERCİHİ</Text>
                                </View>
                            )}

                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View style={[styles.planTagBadge, { backgroundColor: plan.accent + '18' }]}>
                                    <Text style={[styles.planTag, { color: plan.accent }]}>{plan.tag}</Text>
                                </View>
                                <View style={styles.priceBlock}>
                                    <Text style={[styles.price, { color: plan.accent }]}>{plan.price}</Text>
                                    <Text style={[styles.pricePeriod, { color: colors.textTertiary }]}>{plan.period}</Text>
                                </View>
                            </View>

                            <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>

                            {/* Key Stats Row */}
                            <View style={[styles.statsRow, { borderColor: colors.borderLight }]}>
                                <View style={styles.statItem}>
                                    <Ionicons name="people-outline" size={16} color={plan.accent} />
                                    <Text style={[styles.statText, { color: colors.textSecondary }]}>{plan.userLimit}</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
                                <View style={styles.statItem}>
                                    <Ionicons name="cloud-outline" size={16} color={plan.accent} />
                                    <Text style={[styles.statText, { color: colors.textSecondary }]}>{plan.storage}</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
                                <View style={styles.statItem}>
                                    <Ionicons name="headset-outline" size={16} color={plan.accent} />
                                    <Text style={[styles.statText, { color: colors.textSecondary }]} numberOfLines={1}>{plan.support}</Text>
                                </View>
                            </View>

                            {/* Features */}
                            <View style={styles.featureSection}>
                                {plan.features.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <View style={[styles.featureDot, { backgroundColor: plan.accent }]} />
                                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
                                    </View>
                                ))}
                                {plan.missing.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <View style={[styles.featureDot, { backgroundColor: colors.borderLight }]} />
                                        <Text style={[styles.featureText, { color: colors.textTertiary }, styles.strikeText]}>{f}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* CTA Button */}
                            {isCurrent ? (
                                <View style={[styles.activeBtn, { borderColor: plan.accent + '40' }]}>
                                    <Ionicons name="checkmark-circle" size={18} color={plan.accent} />
                                    <Text style={[styles.activeBtnText, { color: plan.accent }]}>Mevcut Planınız</Text>
                                </View>
                            ) : isUpgrade ? (
                                <TouchableOpacity onPress={() => handleUpgrade(plan.name)} activeOpacity={0.85}>
                                    <LinearGradient
                                        colors={plan.id === 'pro' ? ['#1E3A8A', '#2563EB'] : ['#0F172A', '#1E293B']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.upgradeBtn}
                                    >
                                        <Text style={styles.upgradeBtnText}>
                                            {plan.id === 'enterprise' ? 'Teklif Talep Et' : 'Yükselt'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.activeBtn, { borderColor: colors.borderLight }]}>
                                    <Text style={[styles.activeBtnText, { color: colors.textTertiary }]}>Mevcut Planın Altında</Text>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* ── Footer Note ── */}
                <View style={[styles.footerNote, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
                    <Text style={[styles.footerNoteText, { color: colors.textTertiary }]}>
                        Yükseltme talepleriniz WorkFlow360 ekibi tarafından en kısa sürede değerlendirilecektir. Plan değişikliklerinde mevcut verilere erişim kesintisiz devam eder.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },

    scroll: { padding: Spacing.xl },

    // Company Banner
    companyBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 18,
        padding: 20,
        marginBottom: 14,
        ...Shadows.medium,
    },
    bannerCompanyLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginBottom: 3 },
    bannerCompanyName: { color: '#FFF', fontSize: 18, fontWeight: '800', maxWidth: width * 0.5 },
    bannerRight: { alignItems: 'flex-end', gap: 8 },
    planPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    planPillText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    bannerSince: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

    // Trust Row
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    trustItem: { alignItems: 'center', gap: 5 },
    trustLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

    // Section Header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
    sectionDivider: { flex: 1, height: 1 },

    // Plan Card
    card: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden',
        ...Shadows.small,
    },
    recommendedBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    recommendedBarText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 0,
    },
    planTagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    planTag: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
    priceBlock: { alignItems: 'flex-end' },
    price: { fontSize: 22, fontWeight: '900' },
    pricePeriod: { fontSize: 11, fontWeight: '600', marginTop: 1 },
    planName: { fontSize: 18, fontWeight: '800', paddingHorizontal: 20, marginTop: 6, marginBottom: 14 },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 4 },
    statDivider: { width: 1 },
    statText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

    // Features
    featureSection: { paddingHorizontal: 20, marginBottom: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
    featureDot: { width: 7, height: 7, borderRadius: 4 },
    featureText: { fontSize: 13, fontWeight: '500' },
    strikeText: { textDecorationLine: 'line-through', opacity: 0.5 },

    // CTA Buttons
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 15,
        borderRadius: 14,
    },
    upgradeBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    activeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    activeBtnText: { fontSize: 14, fontWeight: '700' },

    // Footer Note
    footerNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    footerNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
