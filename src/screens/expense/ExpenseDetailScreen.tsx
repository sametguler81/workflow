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
    Dimensions,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
// @ts-ignore
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme/theme';
import { getExpenseById, updateExpenseStatus, Expense } from '../../services/expenseService';
import { getUserProfile } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';

interface ExpenseDetailScreenProps {
    route: any;
    navigation: any; // Add navigation prop
}

const { width } = Dimensions.get('window');

function DetailRow({ icon, label, value, colors, isLast = false }: { icon: string; label: string; value: string; colors: any, isLast?: boolean }) {
    return (
        <View style={[detailStyles.row, isLast && detailStyles.lastRow, { borderBottomColor: colors.borderLight }]}>
            <View style={detailStyles.labelRow}>
                <View style={[detailStyles.iconBox, { backgroundColor: colors.background }]}>
                    <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
                </View>
                <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <Text style={[detailStyles.value, { color: colors.text }]}>{value}</Text>
        </View>
    );
}

export function ExpenseDetailScreen({ route, navigation }: ExpenseDetailScreenProps) {
    const { expenseId } = route.params;
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewerName, setReviewerName] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showImage, setShowImage] = useState(false);

    const onBack = () => navigation.goBack();

    const canReview =
        (profile?.role === 'admin' || profile?.role === 'muhasebe' || profile?.role === 'idari') &&
        expense?.status === 'pending';

    const canDownload =
        profile?.role === 'admin' ||
        profile?.role === 'muhasebe' ||
        profile?.role === 'idari' ||
        profile?.uid === expense?.userId;

    const canEdit =
        profile?.role === 'admin' ||
        profile?.role === 'muhasebe' ||
        profile?.role === 'idari';

    const loadExpense = useCallback(async () => {
        try {
            const data = await getExpenseById(expenseId);
            setExpense(data);
            if (data?.reviewedBy) {
                resolveReviewerName(data.reviewedBy);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [expenseId]);

    useEffect(() => { loadExpense(); }, [loadExpense]);

    // Reload when focusing back (in case of edit)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadExpense();
        });
        return unsubscribe;
    }, [navigation, loadExpense]);


    const resolveReviewerName = async (reviewedBy: string) => {
        if (reviewedBy.includes(' ') || reviewedBy.length < 20) {
            setReviewerName(reviewedBy);
            return;
        }
        try {
            const userProfile = await getUserProfile(reviewedBy);
            setReviewerName(userProfile?.displayName || reviewedBy);
        } catch {
            setReviewerName(reviewedBy);
        }
    };

    const handleEdit = () => {
        if (!expense) return;
        navigation.navigate('ExpenseUpload', { expense });
    };

    const handleApprove = async () => {
        if (!profile || !expense) return;
        Alert.alert('Onayla', 'Bu fişi onaylamak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Evet, Onayla',
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await updateExpenseStatus(expenseId, 'approved', profile.displayName, reviewNote);
                        await loadExpense();
                        Alert.alert('Başarılı', 'Fiş onaylandı ✅');
                    } catch (err) {
                        Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    };

    const handleReject = async () => {
        if (!profile || !expense) return;
        setActionLoading(true);
        try {
            await updateExpenseStatus(expenseId, 'rejected', profile.displayName, reviewNote);
            setShowRejectModal(false);
            await loadExpense();
            Alert.alert('Başarılı', 'Fiş reddedildi ❌');
        } catch (err) {
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!expense?.imageBase64 && !expense?.imageUri) {
            Alert.alert('Hata', 'İndirilecek dosya bulunamadı.');
            return;
        }

        setDownloading(true);
        try {
            const fileName = `fis_${expense.id}_${Date.now()}.jpg`;
            const filePath = `${FileSystem.cacheDirectory}${fileName}`;

            if (expense.imageBase64) {
                const rawBase64 = expense.imageBase64.replace(/^data:image\/\w+;base64,/, '');
                await FileSystem.writeAsStringAsync(filePath, rawBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                });
            } else if (expense.imageUri) {
                if (expense.imageUri.startsWith('http')) {
                    await FileSystem.downloadAsync(expense.imageUri, filePath);
                } else {
                    await FileSystem.copyAsync({ from: expense.imageUri, to: filePath });
                }
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'image/jpeg',
                    dialogTitle: 'Fişi İndir',
                });
            } else {
                Alert.alert('Bilgi', 'Dosya kaydedildi: ' + filePath);
            }
        } catch (err) {
            console.error('Download error:', err);
            Alert.alert('Hata', 'Dosya indirilemedi.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <LoadingSpinner message="Yükleniyor..." />;
    if (!expense) return <LoadingSpinner message="Fiş bulunamadı" />;

    const imageSource = expense.imageBase64
        ? { uri: expense.imageBase64 }
        : expense.imageUri
            ? { uri: expense.imageUri }
            : null;

    const paymentMethodLabel = expense.paymentMethod === 'company_card' ? 'Şirket Kredi Kartı' : 'Kendi Cebinden';
    const paymentMethodColor = expense.paymentMethod === 'company_card' ? Colors.danger : Colors.success;
    const paymentMethodIcon = expense.paymentMethod === 'company_card' ? 'card' : 'wallet';

    return (
        <View style={[detailStyles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[Colors.primary, '#3A7BD5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={detailStyles.headerGradient}
            >
                <View style={detailStyles.header}>
                    <TouchableOpacity onPress={onBack} style={detailStyles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={detailStyles.headerTitle}>Fiş Detayı</Text>
                    {canEdit ? (
                        <TouchableOpacity onPress={handleEdit} style={detailStyles.editButton}>
                            <Ionicons name="pencil" size={20} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>

                <View style={detailStyles.amountContainer}>
                    <Text style={detailStyles.amountLabel}>Toplam Tutar</Text>
                    <Text style={detailStyles.amountValue}>₺{expense.amount.toFixed(2)}</Text>
                    <View style={detailStyles.statusBadgeContainer}>
                        <StatusBadge status={expense.status} />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={detailStyles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Payment Method Banner */}
                <View style={[detailStyles.paymentBanner, { backgroundColor: paymentMethodColor + '10', borderColor: paymentMethodColor + '30' }]}>
                    <View style={[detailStyles.paymentIcon, { backgroundColor: paymentMethodColor }]}>
                        <Ionicons name={paymentMethodIcon} size={20} color="#FFF" />
                    </View>
                    <View style={detailStyles.paymentInfo}>
                        <Text style={[detailStyles.paymentTitle, { color: colors.text }]}>Ödeme Yöntemi</Text>
                        <Text style={[detailStyles.paymentDesc, { color: colors.textSecondary }]}>{paymentMethodLabel}</Text>
                    </View>
                </View>

                {/* Details Card */}
                <View style={[detailStyles.card, { backgroundColor: colors.card, ...Shadows.small }]}>
                    <Text style={[detailStyles.sectionTitle, { color: colors.text }]}>Belge Bilgileri</Text>

                    <DetailRow icon="person-outline" label="Yükleyen" value={expense.userName} colors={colors} />
                    <DetailRow icon="calendar-outline" label="Tarih" value={expense.date} colors={colors} />
                    <DetailRow icon="document-text-outline" label="Açıklama" value={expense.description || '-'} colors={colors} />
                    <DetailRow icon="time-outline" label="Oluşturulma" value={new Date(expense.createdAt).toLocaleDateString('tr-TR')} colors={colors} isLast={!expense.reviewedBy && !expense.reviewNote} />

                    {expense.reviewedBy && (
                        <DetailRow icon="checkmark-circle-outline" label="İnceleyen" value={reviewerName || expense.reviewedBy} colors={colors} isLast={!expense.reviewNote} />
                    )}
                    {expense.reviewNote ? (
                        <DetailRow icon="chatbox-outline" label="Not" value={expense.reviewNote} colors={colors} isLast={true} />
                    ) : null}
                </View>

                {/* Image Card */}
                {imageSource && (
                    <View style={[detailStyles.card, { backgroundColor: colors.card, ...Shadows.small, overflow: 'hidden', padding: 0 }]}>
                        <View style={detailStyles.imageHeader}>
                            <Text style={[detailStyles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Belge Görseli</Text>
                            <TouchableOpacity onPress={() => setShowImage(true)}>
                                <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 13 }}>Büyüt</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => setShowImage(true)} activeOpacity={0.9}>
                            <Image source={imageSource} style={detailStyles.image} resizeMode="cover" />
                        </TouchableOpacity>

                        {canDownload && (
                            <TouchableOpacity
                                style={[detailStyles.downloadBtn, { borderTopColor: colors.borderLight }]}
                                onPress={handleDownload}
                                disabled={downloading}
                            >
                                <Ionicons
                                    name={downloading ? 'hourglass-outline' : 'download-outline'}
                                    size={20}
                                    color={Colors.primary}
                                />
                                <Text style={[detailStyles.downloadText, { color: Colors.primary }]}>
                                    {downloading ? 'İndiriliyor...' : 'Fişi İndir / Paylaş'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Float Actions */}
            {canReview && (
                <View style={[detailStyles.floatActions, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
                    <TouchableOpacity
                        style={[detailStyles.actionBtn, { backgroundColor: Colors.danger + '15' }]}
                        onPress={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                    >
                        <Ionicons name="close-circle" size={20} color={Colors.danger} />
                        <Text style={[detailStyles.actionText, { color: Colors.danger }]}>Reddet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[detailStyles.actionBtn, { backgroundColor: Colors.success }]}
                        onPress={handleApprove}
                        disabled={actionLoading}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                        <Text style={[detailStyles.actionText, { color: '#FFF' }]}>Onayla</Text>
                    </TouchableOpacity>
                </View>
            )}

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
                        <Ionicons name="close-circle" size={36} color="#FFF" />
                    </TouchableOpacity>
                    {imageSource && (
                        <Image
                            source={imageSource}
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
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    amountContainer: {
        alignItems: 'center',
        gap: 4,
    },
    amountLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    amountValue: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 8,
    },
    statusBadgeContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    content: {
        flex: 1,
        marginTop: 20,
        paddingHorizontal: Spacing.lg,
    },
    card: {
        borderRadius: 24,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '50%',
        textAlign: 'right',
    },

    // Payment Banner
    paymentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    paymentDesc: {
        fontSize: 13,
        marginTop: 2,
    },

    // Image Section
    imageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    image: {
        width: '100%',
        height: 250,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 8,
        borderTopWidth: 1,
    },
    downloadText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Floating Actions
    floatActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: Spacing.xl,
        paddingBottom: 34,
        gap: Spacing.md,
        borderTopWidth: 1,
        ...Shadows.medium,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        borderRadius: 24,
        padding: Spacing.xl,
        ...Shadows.large,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
    modalInput: {
        borderRadius: 16,
        padding: Spacing.lg,
        borderWidth: 1,
        minHeight: 100,
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
        borderRadius: 16,
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
        width: '100%',
        height: '80%',
    },
});
