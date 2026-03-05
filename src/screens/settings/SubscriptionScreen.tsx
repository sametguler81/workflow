import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getCompany, Company } from '../../services/companyService';
import {
    validateReceipt,
    getProductId,
    getPlanFromProductId,
    ALL_SUBSCRIPTION_SKUS,
} from '../../services/iapService';
import { IAP_ENABLED } from '../../config/iapConfig';

// expo-iap — sadece IAP_ENABLED true olduğunda yüklenir
let useIAP: any = null;
if (IAP_ENABLED) {
    try {
        useIAP = require('expo-iap').useIAP;
    } catch (e) {
        console.log('[IAP] expo-iap modülü yüklenemedi');
    }
}

const { width } = Dimensions.get('window');

interface SubscriptionScreenProps {
    onBack: () => void;
}

type BillingPeriod = 'monthly' | 'yearly';

const PLAN_ORDER = ['free', 'pro', 'enterprise'];

const PLANS = [
    {
        id: 'free',
        name: 'Başlangıç',
        tag: 'FREE',
        monthlyPrice: 0,
        yearlyPrice: 0,
        userLimit: '5 Kullanıcı',
        storage: '5 GB Toplam Depolama',
        support: 'Temel E-posta Destek',
        features: ['5 Kullanıcı Limitli', '5 GB Toplam Depolama', 'İzin Yönetimi', 'Fiş/Fatura Yükleme', 'Temel Raporlar', 'QR Yoklama', 'Zimmet Yönetimi'],
        missing: ['Özel Raporlar', 'AI Raporlama ve Destek', 'Geliştirilebilir Raporlar'],
        accent: '#64748B',
        gradient: ['#64748B', '#475569'] as const,
    },
    {
        id: 'pro',
        name: 'Profesyonel',
        tag: 'PRO',
        monthlyPrice: 499,
        yearlyPrice: 4499,
        userLimit: '20 Kullanıcı',
        storage: '20 GB Toplam Depolama',
        support: '7/24 Öncelikli Destek',
        features: ['20 Kullanıcı Limitli', 'Sınırsız Belge Yükleme', 'İzin Yönetimi', 'Fiş/Fatura Yükleme', 'Özel Raporlar', 'QR Yoklama', 'Zimmet Yönetimi'],
        missing: ['AI Raporlama ve Destek', 'Geliştirilebilir Raporlar'],
        accent: '#1E40AF',
        gradient: ['#1E3A8A', '#2563EB'] as const,
        recommended: true,
    },
    {
        id: 'enterprise',
        name: 'Kurumsal',
        tag: 'ENTERPRISE',
        monthlyPrice: 999,
        yearlyPrice: 8999,
        userLimit: 'Sınırsız Kullanıcı',
        storage: 'Sınırsız Depolama',
        support: 'Özel Müşteri Temsilcisi',
        features: ['İzin Yönetimi', 'AI Raporlama ve Destek', 'Fiş/Fatura Yükleme', 'Geliştirilebilir Raporlar', 'QR Yoklama', 'Zimmet Yönetimi', 'Duyuru Sistemi'],
        missing: [],
        accent: '#7C3AED',
        gradient: ['#5B21B6', '#7C3AED'] as const,
    },
];

const TRUST_ITEMS = [
    { icon: 'shield-checkmark-outline', label: 'SSL Şifrelemesi' },
    { icon: 'cloud-done-outline', label: 'KVKK Uyumlu' },
    { icon: 'lock-closed-outline', label: 'İzole Veri' },
    { icon: 'refresh-outline', label: '99.9% SLA' },
];

function formatPrice(price: number): string {
    if (price === 0) return '₺0';
    return `₺${price.toLocaleString('tr-TR')}`;
}

function calculateSavings(monthly: number, yearly: number): number {
    if (monthly === 0) return 0;
    const totalMonthly = monthly * 12;
    return Math.round(((totalMonthly - yearly) / totalMonthly) * 100);
}

function formatSize(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
}

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
    const { profile } = useAuth();
    const { colors, isDark } = useTheme();
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [iapAvailable, setIapAvailable] = useState(false);

    // ── expo-iap hook ──
    // useIAP null olabilir (modül yüklenemediğinde)
    const iapResult = useIAP ? useIAP({
        onPurchaseSuccess: async (purchase: any) => {
            try {
                const receipt = Platform.OS === 'ios'
                    ? purchase.transactionReceipt
                    : purchase.purchaseToken;

                if (!receipt || !profile?.companyId) {
                    throw new Error('Receipt veya firma bilgisi bulunamadı');
                }

                const productId = purchase.productId || '';
                const result = await validateReceipt(
                    receipt,
                    productId,
                    Platform.OS as 'ios' | 'android',
                );

                if (result.valid) {
                    await iapResult?.finishTransaction?.({ purchase, isConsumable: false });
                    const updated = await getCompany(profile.companyId);
                    setCompany(updated);

                    Alert.alert(
                        'Başarılı! 🎉',
                        `Planınız ${result.plan === 'pro' ? 'Profesyonel' : 'Kurumsal'} olarak güncellendi.`,
                        [{ text: 'Tamam' }],
                    );
                } else {
                    Alert.alert('Hata', result.error || 'Ödeme doğrulanamadı.');
                }
            } catch (error: any) {
                console.error('Purchase completion error:', error);
                Alert.alert('Hata', 'Satın alma tamamlanamadı.');
            } finally {
                setPurchasing(false);
            }
        },
        onPurchaseError: (error: any) => {
            console.error('Purchase error:', error);
            setPurchasing(false);
            if (error.message?.includes('cancel') || error.message?.includes('E_USER_CANCELLED')) return;
            Alert.alert('Hata', 'Satın alma işlemi başarısız oldu.');
        },
    }) : null;

    // ── Store bağlantı durumunu takip et ──
    useEffect(() => {
        if (iapResult?.connected) {
            setIapAvailable(true);
            try {
                iapResult.fetchProducts?.({ skus: ALL_SUBSCRIPTION_SKUS, type: 'subs' });
            } catch (e) {
                console.log('[IAP] Ürünler yüklenemedi:', e);
            }
        }
    }, [iapResult?.connected]);

    // ── Firma bilgisini yükle ──
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

    // ── Satın alma başlat ──
    const handleUpgrade = useCallback(async (planId: 'pro' | 'enterprise') => {
        if (!iapAvailable || !iapResult?.requestPurchase) {
            Alert.alert(
                'Mağaza Bağlantısı Yok',
                'Ödeme sistemi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
            );
            return;
        }

        const productId = getProductId(planId, billingPeriod);
        setPurchasing(true);

        try {
            await iapResult.requestPurchase({
                request: {
                    apple: { sku: productId },
                    google: { skus: [productId] },
                },
                type: 'subs',
            });
        } catch (error: any) {
            setPurchasing(false);
            console.error('Purchase request error:', error);
        }
    }, [iapAvailable, iapResult, billingPeriod]);

    // ── Satın almaları geri yükle ──
    const handleRestore = useCallback(async () => {
        if (!iapAvailable || !iapResult?.getAvailablePurchases) {
            Alert.alert('Bağlantı Hatası', 'Mağaza bağlantısı kurulamadı.');
            return;
        }

        setRestoring(true);
        try {
            const purchases = await iapResult.getAvailablePurchases();

            if (purchases && Array.isArray(purchases) && purchases.length > 0) {
                const latest = purchases[purchases.length - 1];
                const receipt = Platform.OS === 'ios'
                    ? (latest as any).transactionReceipt
                    : (latest as any).purchaseToken;

                if (receipt && profile?.companyId) {
                    const result = await validateReceipt(
                        receipt,
                        latest.productId || '',
                        Platform.OS as 'ios' | 'android',
                    );

                    if (result.valid) {
                        const updated = await getCompany(profile.companyId);
                        setCompany(updated);
                        Alert.alert('Başarılı', 'Aboneliğiniz geri yüklendi.');
                    } else {
                        Alert.alert('Bilgi', 'Aktif bir abonelik bulunamadı.');
                    }
                }
            } else {
                Alert.alert('Bilgi', 'Geri yüklenecek bir satın alma bulunamadı.');
            }
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert('Hata', 'Satın almalar geri yüklenemedi.');
        } finally {
            setRestoring(false);
        }
    }, [iapAvailable, iapResult, profile]);

    const currentPlanId = company?.plan || 'free';
    const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];

    // Calculate storage limit logic
    const usedStorage = company?.usedStorage || 0;
    const isEnterprise = currentPlan.id === 'enterprise';

    // Limit is defined in plans.ts dynamically, so we map it here:
    // free: 5GB, pro: 20GB, enterprise: unlimited
    const storageLimitBytes = isEnterprise
        ? -1
        : currentPlan.id === 'pro'
            ? 20 * 1024 * 1024 * 1024
            : 5 * 1024 * 1024 * 1024;

    const storagePercentage = isEnterprise
        ? 0
        : Math.min((usedStorage / storageLimitBytes) * 100, 100);

    const storageColor = storagePercentage > 90
        ? Colors.danger
        : storagePercentage > 75
            ? Colors.warning
            : Colors.primary;

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

                {/* ── Storage Usage Card ── */}
                <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={styles.storageHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="cloud-outline" size={18} color={Colors.primary} />
                            <Text style={[styles.storageTitle, { color: colors.text }]}>Depolama Alanı</Text>
                        </View>
                        <Text style={[styles.storageValue, { color: colors.textSecondary }]}>
                            {formatSize(usedStorage)} / {isEnterprise ? 'Sınırsız' : formatSize(storageLimitBytes)}
                        </Text>
                    </View>

                    <View style={[styles.progressBarContainer, { backgroundColor: colors.borderLight }]}>
                        {!isEnterprise ? (
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${storagePercentage}%`, backgroundColor: storageColor }
                                ]}
                            />
                        ) : (
                            <LinearGradient
                                colors={['#7C3AED', '#3B82F6', '#10B981']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBarFill, { width: '100%' }]}
                            />
                        )}
                    </View>

                    {!isEnterprise && storagePercentage > 85 && (
                        <Text style={[styles.storageWarning, { color: storageColor }]}>
                            Depolama alanınız dolmak üzere. ({storagePercentage.toFixed(1)}%)
                        </Text>
                    )}
                </View>

                {/* ── Trust Row ── */}
                <View style={[styles.trustRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    {TRUST_ITEMS.map((item) => (
                        <View key={item.label} style={styles.trustItem}>
                            <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                            <Text style={[styles.trustLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Billing Period Toggle ── */}
                <View style={[styles.billingToggleContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={[styles.billingToggle, { backgroundColor: isDark ? colors.surfaceVariant : '#F1F5F9' }]}>
                        <TouchableOpacity
                            style={[
                                styles.billingOption,
                                billingPeriod === 'monthly' && styles.billingOptionActive,
                            ]}
                            onPress={() => setBillingPeriod('monthly')}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.billingOptionText,
                                { color: billingPeriod === 'monthly' ? '#FFF' : colors.textSecondary },
                            ]}>
                                Aylık
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.billingOption,
                                billingPeriod === 'yearly' && styles.billingOptionActive,
                            ]}
                            onPress={() => setBillingPeriod('yearly')}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.billingOptionText,
                                { color: billingPeriod === 'yearly' ? '#FFF' : colors.textSecondary },
                            ]}>
                                Yıllık
                            </Text>
                            <View style={styles.savingsBadge}>
                                <Text style={styles.savingsBadgeText}>Tasarruf</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
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
                    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                    const savings = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
                    const isFree = plan.monthlyPrice === 0;
                    const periodLabel = isFree ? 'Sonsuza dek' : billingPeriod === 'monthly' ? '/ ay' : '/ yıl';

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
                                <LinearGradient
                                    colors={plan.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.recommendedBar}
                                >
                                    <Ionicons name="star" size={11} color="#FFF" />
                                    <Text style={styles.recommendedBarText}>KURUMSAL KULLANICILARIN TERCİHİ</Text>
                                </LinearGradient>
                            )}

                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View style={[styles.planTagBadge, { backgroundColor: plan.accent + '18' }]}>
                                    <Text style={[styles.planTag, { color: plan.accent }]}>{plan.tag}</Text>
                                </View>
                                <View style={styles.priceBlock}>
                                    <View style={styles.priceRow}>
                                        <Text style={[styles.price, { color: plan.accent }]}>
                                            {isFree ? '₺0' : formatPrice(price)}
                                        </Text>
                                        <Text style={[styles.pricePeriod, { color: colors.textTertiary }]}>{periodLabel}</Text>
                                    </View>
                                    {/* Yearly savings */}
                                    {billingPeriod === 'yearly' && savings > 0 && !isFree && (
                                        <View style={[styles.yearlySavingsBadge, { backgroundColor: Colors.success + '15' }]}>
                                            <Ionicons name="trending-down" size={12} color={Colors.success} />
                                            <Text style={[styles.yearlySavingsText, { color: Colors.success }]}>
                                                %{savings} tasarruf
                                            </Text>
                                        </View>
                                    )}
                                    {/* Monthly equivalent for yearly */}
                                    {billingPeriod === 'yearly' && !isFree && (
                                        <Text style={[styles.monthlyEquivalent, { color: colors.textTertiary }]}>
                                            aylık ~{formatPrice(Math.round(price / 12))}
                                        </Text>
                                    )}
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
                                        <Ionicons name="checkmark-circle" size={16} color={plan.accent} />
                                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
                                    </View>
                                ))}
                                {plan.missing.map((f, i) => (
                                    <View key={i} style={styles.featureRow}>
                                        <Ionicons name="close-circle" size={16} color={colors.borderLight} />
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
                                <TouchableOpacity
                                    onPress={() => handleUpgrade(plan.id as 'pro' | 'enterprise')}
                                    activeOpacity={0.85}
                                    disabled={purchasing}
                                >
                                    <LinearGradient
                                        colors={plan.gradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.upgradeBtn, purchasing && { opacity: 0.7 }]}
                                    >
                                        {purchasing ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Text style={styles.upgradeBtnText}>Satın Al</Text>
                                                <Ionicons name="card-outline" size={16} color="#FFF" />
                                            </>
                                        )}
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

                {/* ── Restore Purchases ── */}
                <TouchableOpacity
                    style={[styles.restoreBtn, { borderColor: colors.borderLight }]}
                    onPress={handleRestore}
                    disabled={restoring}
                    activeOpacity={0.7}
                >
                    {restoring ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <>
                            <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
                            <Text style={[styles.restoreBtnText, { color: Colors.primary }]}>Satın Almaları Geri Yükle</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* ── Footer Note ── */}
                <View style={[styles.footerNote, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
                    <Text style={[styles.footerNoteText, { color: colors.textTertiary }]}>
                        Ödeme işlemleri {Platform.OS === 'ios' ? 'Apple App Store' : 'Google Play Store'} üzerinden güvenle gerçekleştirilir. Abonelikler otomatik olarak yenilenir ve istediğiniz zaman iptal edebilirsiniz.
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

    trustRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    trustItem: { alignItems: 'center', gap: 5 },
    trustLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

    // Storage Usage
    storageCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    storageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    storageTitle: { fontSize: 14, fontWeight: '700' },
    storageValue: { fontSize: 13, fontWeight: '600' },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    storageWarning: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },

    // Billing Period Toggle
    billingToggleContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        marginBottom: 20,
    },
    billingToggle: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
    },
    billingOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    billingOptionActive: {
        backgroundColor: Colors.primary,
        ...Shadows.small,
    },
    billingOptionText: {
        fontSize: 15,
        fontWeight: '700',
    },
    savingsBadge: {
        backgroundColor: Colors.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    savingsBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },

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
        alignItems: 'flex-start',
        padding: 20,
        paddingBottom: 0,
    },
    planTagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    planTag: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
    priceBlock: { alignItems: 'flex-end' },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    price: { fontSize: 24, fontWeight: '900' },
    pricePeriod: { fontSize: 12, fontWeight: '600' },
    yearlySavingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 6,
    },
    yearlySavingsText: { fontSize: 11, fontWeight: '700' },
    monthlyEquivalent: { fontSize: 11, fontWeight: '500', marginTop: 2 },
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
    restoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    restoreBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
