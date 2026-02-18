import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    generateDailyQR,
    getTodayQR,
    getTodayAttendanceCount,
    AttendanceQR,
} from '../../services/attendanceService';

interface AttendanceQRScreenProps {
    onBack: () => void;
    onNavigateReport: () => void;
}

export function AttendanceQRScreen({ onBack, onNavigateReport }: AttendanceQRScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [qrData, setQrData] = useState<AttendanceQR | null>(null);
    const [todayCount, setTodayCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const [qr, count] = await Promise.all([
                getTodayQR(profile.companyId),
                getTodayAttendanceCount(profile.companyId),
            ]);
            setQrData(qr);
            setTodayCount(count);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGenerateQR = async () => {
        if (!profile || generating) return;
        setGenerating(true);
        try {
            const qr = await generateDailyQR(profile.companyId, profile.uid);
            setQrData(qr);
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={['#667eea', '#764ba2'] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Yoklama QR Kodu</Text>
                        <TouchableOpacity onPress={onNavigateReport}>
                            <Ionicons name="bar-chart-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Çalışanların taraması için QR kodu oluşturun
                    </Text>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Today's Count */}
                    <View style={[styles.countCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <LinearGradient
                            colors={Colors.gradientSuccess as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.countBadge}
                        >
                            <Ionicons name="people" size={18} color="#FFF" />
                            <Text style={styles.countBadgeText}>{todayCount}</Text>
                        </LinearGradient>
                        <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                            Bugün yoklama veren personel
                        </Text>
                    </View>

                    {/* QR Code Display */}
                    {loading ? (
                        <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                Yükleniyor...
                            </Text>
                        </View>
                    ) : qrData ? (
                        <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                            <Text style={[styles.qrDateTitle, { color: colors.text }]}>
                                📅 {formatDate(qrData.date)}
                            </Text>
                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={qrData.token}
                                    size={220}
                                    backgroundColor="white"
                                    color="#1A1A2E"
                                />
                            </View>
                            <View style={styles.qrInfo}>
                                <View style={styles.qrInfoRow}>
                                    <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                                    <Text style={[styles.qrInfoText, { color: colors.textSecondary }]}>
                                        Oluşturulma: {formatTime(qrData.createdAt)}
                                    </Text>
                                </View>
                                <View style={styles.qrInfoRow}>
                                    <Ionicons name="timer-outline" size={16} color={colors.textTertiary} />
                                    <Text style={[styles.qrInfoText, { color: colors.textSecondary }]}>
                                        Geçerlilik: Gün sonuna kadar
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.activeBadge, { backgroundColor: Colors.successLight }]}>
                                <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                                <Text style={[styles.activeBadgeText, { color: Colors.success }]}>
                                    Aktif
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                            <Ionicons name="qr-code-outline" size={80} color={colors.textTertiary} />
                            <Text style={[styles.noQrTitle, { color: colors.text }]}>
                                Bugün QR Kod Oluşturulmadı
                            </Text>
                            <Text style={[styles.noQrText, { color: colors.textSecondary }]}>
                                Çalışanların yoklama verebilmesi için günlük QR kod oluşturmanız gerekmektedir.
                            </Text>
                        </View>
                    )}

                    {/* Generate Button */}
                    {!qrData && !loading && (
                        <TouchableOpacity
                            onPress={handleGenerateQR}
                            disabled={generating}
                            style={styles.generateBtn}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={Colors.gradientPrimary as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.generateBtnInner}
                            >
                                {generating ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="qr-code" size={22} color="#FFF" />
                                        <Text style={styles.generateBtnText}>QR Kod Oluştur</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Report Button */}
                    <TouchableOpacity
                        onPress={onNavigateReport}
                        style={[styles.reportBtn, { borderColor: colors.border }]}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={Colors.gradientSuccess as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.reportBtnInner}
                        >
                            <Ionicons name="stats-chart" size={20} color="#FFF" />
                            <Text style={styles.reportBtnText}>Yoklama Raporlarını Görüntüle</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: { padding: 4 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    content: {
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.xl,
    },
    // Count card
    countCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: BorderRadius.full,
        gap: 6,
    },
    countBadgeText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    countLabel: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    // QR Card
    qrCard: {
        alignItems: 'center',
        padding: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: Spacing.lg,
        ...Shadows.medium,
    },
    qrDateTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    qrWrapper: {
        padding: Spacing.xl,
        backgroundColor: '#FFFFFF',
        borderRadius: BorderRadius.lg,
        ...Shadows.small,
    },
    qrInfo: {
        gap: Spacing.sm,
    },
    qrInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    qrInfoText: {
        fontSize: 13,
        fontWeight: '500',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    activeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    noQrTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    noQrText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Generate button
    generateBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginTop: Spacing.xl,
    },
    generateBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
        borderRadius: BorderRadius.lg,
    },
    generateBtnText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
    // Report button
    reportBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginTop: Spacing.lg,
    },
    reportBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
        borderRadius: BorderRadius.lg,
    },
    reportBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
