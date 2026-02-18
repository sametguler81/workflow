import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    TextInput,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getInvoiceById,
    updateInvoiceStatus,
    Invoice,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_TYPE_ICONS,
} from '../../services/invoiceService';
import { getUserProfile } from '../../services/authService';

interface InvoiceDetailScreenProps {
    invoiceId: string;
    onBack: () => void;
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

export function InvoiceDetailScreen({ invoiceId, onBack }: InvoiceDetailScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviewerName, setReviewerName] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [showImage, setShowImage] = useState(false);

    const canReview = profile?.role === 'idari' || profile?.role === 'admin' || profile?.role === 'muhasebe';

    const loadInvoice = useCallback(async () => {
        try {
            const data = await getInvoiceById(invoiceId);
            setInvoice(data);
            if (data?.reviewedBy) {
                resolveReviewerName(data.reviewedBy);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [invoiceId]);

    const resolveReviewerName = async (reviewedBy: string) => {
        // If it looks like a uid (no spaces, long string), fetch the profile
        if (reviewedBy && !reviewedBy.includes(' ') && reviewedBy.length > 10) {
            try {
                const userProfile = await getUserProfile(reviewedBy);
                if (userProfile?.displayName) {
                    setReviewerName(userProfile.displayName);
                    return;
                }
            } catch (_) { /* fall through */ }
        }
        setReviewerName(reviewedBy);
    };

    useEffect(() => {
        loadInvoice();
    }, [loadInvoice]);

    const handleApprove = async () => {
        if (!profile || !invoice) return;
        setActionLoading(true);
        try {
            await updateInvoiceStatus(invoice.id, 'approved', profile.displayName);
            Alert.alert('Onaylandı ✅', 'Belge onaylandı.', [{ text: 'Tamam', onPress: onBack }]);
        } catch (err) {
            Alert.alert('Hata', 'İşlem başarısız.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!profile || !invoice) return;
        setActionLoading(true);
        try {
            await updateInvoiceStatus(invoice.id, 'rejected', profile.displayName, reviewNote);
            setShowRejectModal(false);
            Alert.alert('Reddedildi', 'Belge reddedildi.', [{ text: 'Tamam', onPress: onBack }]);
        } catch (err) {
            Alert.alert('Hata', 'İşlem başarısız.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[detailStyles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={[detailStyles.loading, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Belge bulunamadı</Text>
            </View>
        );
    }

    const imageSource = invoice.imageBase64 || invoice.imageUri;

    return (
        <View style={[detailStyles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={Colors.gradientPrimary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={detailStyles.header}
                >
                    <View style={detailStyles.headerRow}>
                        <TouchableOpacity onPress={onBack} style={detailStyles.headerBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={detailStyles.headerTitle}>Belge Detayı</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={detailStyles.headerBadge}>
                        <StatusBadge status={invoice.status} />
                    </View>
                </LinearGradient>

                <View style={detailStyles.content}>
                    {/* Document Type Badge */}
                    <View style={[detailStyles.typeBadge, { backgroundColor: Colors.primary + '12' }]}>
                        <Ionicons
                            name={DOCUMENT_TYPE_ICONS[invoice.documentType] as any}
                            size={20}
                            color={Colors.primary}
                        />
                        <Text style={[detailStyles.typeBadgeText, { color: Colors.primary }]}>
                            {DOCUMENT_TYPE_LABELS[invoice.documentType]}
                        </Text>
                    </View>

                    {/* Amount Card */}
                    <View style={[detailStyles.amountCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <Text style={[detailStyles.amountLabel, { color: colors.textTertiary }]}>Tutar</Text>
                        <Text style={[detailStyles.amountValue, { color: colors.text }]}>
                            ₺{invoice.amount.toFixed(2)}
                        </Text>
                    </View>

                    {/* Image */}
                    {imageSource ? (
                        <TouchableOpacity onPress={() => setShowImage(true)} activeOpacity={0.8}>
                            <Image source={{ uri: imageSource }} style={detailStyles.image} />
                            <View style={detailStyles.imageOverlay}>
                                <Ionicons name="expand" size={20} color="#FFF" />
                                <Text style={detailStyles.imageOverlayText}>Büyüt</Text>
                            </View>
                        </TouchableOpacity>
                    ) : null}

                    {/* Details */}
                    <View style={[detailStyles.detailCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <DetailRow icon="person-outline" label="İsim" value={invoice.userName} colors={colors} />
                        <DetailRow icon="calendar-outline" label="Tarih" value={invoice.date} colors={colors} />
                        {invoice.description ? (
                            <DetailRow icon="document-text-outline" label="Açıklama" value={invoice.description} colors={colors} />
                        ) : null}
                        {invoice.reviewedBy && (
                            <DetailRow icon="checkmark-circle-outline" label="İnceleyen" value={reviewerName || invoice.reviewedBy} colors={colors} />
                        )}
                        {invoice.reviewNote ? (
                            <DetailRow icon="chatbox-outline" label="Not" value={invoice.reviewNote} colors={colors} />
                        ) : null}
                    </View>

                    {/* Actions */}
                    {canReview && invoice.status === 'pending' && (
                        <View style={detailStyles.actions}>
                            <TouchableOpacity
                                style={[detailStyles.actionBtn, { backgroundColor: Colors.success }]}
                                onPress={handleApprove}
                                disabled={actionLoading}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={detailStyles.actionBtnText}>Onayla</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[detailStyles.actionBtn, { backgroundColor: Colors.danger }]}
                                onPress={() => setShowRejectModal(true)}
                                disabled={actionLoading}
                            >
                                <Ionicons name="close-circle" size={20} color="#FFF" />
                                <Text style={detailStyles.actionBtnText}>Reddet</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Reject Modal */}
            <Modal visible={showRejectModal} transparent animationType="slide">
                <View style={detailStyles.modalOverlay}>
                    <View style={[detailStyles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[detailStyles.modalTitle, { color: colors.text }]}>Red Notu</Text>
                        <TextInput
                            style={[detailStyles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                            placeholder="Neden reddediyorsunuz?"
                            placeholderTextColor={colors.textTertiary}
                            value={reviewNote}
                            onChangeText={setReviewNote}
                            multiline
                        />
                        <View style={detailStyles.modalActions}>
                            <TouchableOpacity
                                style={[detailStyles.modalBtn, { backgroundColor: colors.background }]}
                                onPress={() => setShowRejectModal(false)}
                            >
                                <Text style={{ color: colors.text, fontWeight: '600' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[detailStyles.modalBtn, { backgroundColor: Colors.danger }]}
                                onPress={handleReject}
                                disabled={actionLoading}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '600' }}>Reddet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Full Image Modal */}
            <Modal visible={showImage} transparent animationType="fade">
                <View style={detailStyles.imageModal}>
                    <TouchableOpacity style={detailStyles.imageModalClose} onPress={() => setShowImage(false)}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    {imageSource && (
                        <Image
                            source={{ uri: imageSource }}
                            style={detailStyles.imageModalFull}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const detailStyles = StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 55,
        paddingBottom: 30,
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
    headerBadge: { alignItems: 'center', marginTop: 16 },
    content: { padding: Spacing.xl },

    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: Spacing.lg,
    },
    typeBadgeText: { fontSize: 14, fontWeight: '700' },

    amountCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },
    amountLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
    amountValue: { fontSize: 32, fontWeight: '800' },

    image: {
        width: '100%',
        height: 220,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: Spacing.lg + 8,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
    },
    imageOverlayText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    detailCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { fontSize: 13, fontWeight: '500' },
    value: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        gap: 8,
    },
    actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
    modalInput: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        minHeight: 80,
        fontSize: 15,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    modalBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
    },
    imageModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalClose: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    imageModalFull: {
        width: '95%',
        height: '80%',
    },
});
