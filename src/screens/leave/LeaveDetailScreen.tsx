import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PremiumButton } from '../../components/PremiumButton';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { GradientCard } from '../../components/GradientCard';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import {
    getLeaveById,
    updateLeaveStatus,
    LeaveRequest,
    getLeaveTypeLabel,
} from '../../services/leaveService';
import { getUserProfile } from '../../services/authService';

interface LeaveDetailScreenProps {
    leaveId: string;
    onBack: () => void;
}

export function LeaveDetailScreen({ leaveId, onBack }: LeaveDetailScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [leave, setLeave] = useState<LeaveRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewerName, setReviewerName] = useState<string | null>(null);

    const canReview = (profile?.role === 'admin' || profile?.role === 'idari') && leave?.status === 'pending';

    useEffect(() => {
        loadLeave();
    }, [leaveId]);

    const loadLeave = async () => {
        try {
            const data = await getLeaveById(leaveId);
            setLeave(data);
            if (data?.reviewedBy) {
                resolveReviewerName(data.reviewedBy);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resolveReviewerName = async (reviewedBy: string) => {
        // If it looks like a display name (contains space or is short), use directly
        if (reviewedBy.includes(' ') || reviewedBy.length < 20) {
            setReviewerName(reviewedBy);
            return;
        }
        // Otherwise try to resolve from user profile (it might be a uid)
        try {
            const userProfile = await getUserProfile(reviewedBy);
            setReviewerName(userProfile?.displayName || reviewedBy);
        } catch {
            setReviewerName(reviewedBy);
        }
    };

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!profile || !leave) return;
        const label = status === 'approved' ? 'onaylamak' : 'reddetmek';
        Alert.alert(
            'Onayla',
            `Bu izin talebini ${label} istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await updateLeaveStatus(leaveId, status, profile.displayName || profile.email || 'Admin', reviewNote);
                            await loadLeave();
                            Alert.alert('Başarılı', status === 'approved' ? 'İzin onaylandı ✅' : 'İzin reddedildi ❌');
                        } catch (err) {
                            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) return <LoadingSpinner message="Yükleniyor..." />;
    if (!leave) return <LoadingSpinner message="İzin bulunamadı" />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>İzin Detayı</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <GradientCard
                    gradient={
                        leave.status === 'approved'
                            ? Colors.gradientSuccess
                            : leave.status === 'rejected'
                                ? Colors.gradientDanger
                                : Colors.gradientCard
                    }
                    style={styles.statusCard}
                >
                    <Text style={styles.statusLabel}>Durum</Text>
                    <StatusBadge status={leave.status} />
                    <Text style={styles.typeLabel}>{getLeaveTypeLabel(leave.type)}</Text>
                </GradientCard>

                {/* Details */}
                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <DetailRow icon="person-outline" label="İsim" value={leave.userName} colors={colors} />
                    <DetailRow icon="calendar-outline" label="Başlangıç" value={leave.startDate} colors={colors} />
                    <DetailRow icon="calendar-outline" label="Bitiş" value={leave.endDate} colors={colors} />
                    {leave.description ? (
                        <DetailRow icon="document-text-outline" label="Açıklama" value={leave.description} colors={colors} />
                    ) : null}
                    <DetailRow icon="time-outline" label="Oluşturulma" value={new Date(leave.createdAt).toLocaleDateString('tr-TR')} colors={colors} />
                    {leave.reviewedBy && (
                        <DetailRow icon="checkmark-circle-outline" label="İnceleyen" value={reviewerName || leave.reviewedBy} colors={colors} />
                    )}
                    {leave.reviewNote ? (
                        <DetailRow icon="chatbubble-outline" label="Not" value={leave.reviewNote} colors={colors} />
                    ) : null}
                </View>

                {/* Review Actions */}
                {canReview && (
                    <View style={[styles.reviewSection, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <Text style={[styles.reviewTitle, { color: colors.text }]}>İnceleme</Text>
                        <TextInput
                            style={[styles.reviewInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                            placeholder="Not ekleyin (opsiyonel)..."
                            placeholderTextColor={colors.textTertiary}
                            value={reviewNote}
                            onChangeText={setReviewNote}
                            multiline
                        />
                        <View style={styles.actionRow}>
                            <PremiumButton
                                title="Reddet"
                                onPress={() => handleAction('rejected')}
                                variant="danger"
                                size="md"
                                loading={actionLoading}
                                icon={<Ionicons name="close-circle" size={18} color="#FFF" />}
                                style={styles.halfBtn}
                            />
                            <PremiumButton
                                title="Onayla"
                                onPress={() => handleAction('approved')}
                                size="md"
                                loading={actionLoading}
                                icon={<Ionicons name="checkmark-circle" size={18} color="#FFF" />}
                                style={styles.halfBtn}
                            />
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function DetailRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
    return (
        <View style={detailStyles.row}>
            <View style={detailStyles.labelRow}>
                <Ionicons name={icon as any} size={18} color={colors.textTertiary} />
                <Text style={[detailStyles.label, { color: colors.textTertiary }]}>{label}</Text>
            </View>
            <Text style={[detailStyles.value, { color: colors.text }]}>{value}</Text>
        </View>
    );
}

const detailStyles = StyleSheet.create({
    row: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    label: { fontSize: 12, fontWeight: '500' },
    value: { fontSize: 15, fontWeight: '600', marginLeft: 26 },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: Spacing.xl },
    statusCard: {
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.xl,
    },
    statusLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
    typeLabel: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 4 },
    detailCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
    },
    reviewSection: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
    },
    reviewTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
    reviewInput: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: Spacing.lg,
    },
    actionRow: { flexDirection: 'row', gap: Spacing.md },
    halfBtn: { flex: 1 },
});
