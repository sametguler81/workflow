import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    TextInput,
    Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
// @ts-ignore - expo-sharing works at runtime
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PremiumButton } from '../../components/PremiumButton';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { GradientCard } from '../../components/GradientCard';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import { getExpenseById, updateExpenseStatus, Expense } from '../../services/expenseService';
import { getUserProfile } from '../../services/authService';

interface ExpenseDetailScreenProps {
    expenseId: string;
    onBack: () => void;
}

export function ExpenseDetailScreen({ expenseId, onBack }: ExpenseDetailScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [expense, setExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewerName, setReviewerName] = useState<string | null>(null);

    const canReview =
        (profile?.role === 'admin' || profile?.role === 'muhasebe' || profile?.role === 'idari') &&
        expense?.status === 'pending';

    // Can download: uploader, admins, idari, muhasebe
    const canDownload =
        profile?.role === 'admin' ||
        profile?.role === 'muhasebe' ||
        profile?.role === 'idari' ||
        profile?.uid === expense?.userId;

    useEffect(() => { loadExpense(); }, [expenseId]);

    const loadExpense = async () => {
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
    };

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

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!profile || !expense) return;
        const label = status === 'approved' ? 'onaylamak' : 'reddetmek';
        Alert.alert('Onayla', `Bu fişi ${label} istediğinize emin misiniz?`, [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Evet',
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await updateExpenseStatus(expenseId, status, profile.displayName, reviewNote);
                        await loadExpense();
                        Alert.alert('Başarılı', status === 'approved' ? 'Fiş onaylandı ✅' : 'Fiş reddedildi ❌');
                    } catch (err) {
                        Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
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
                // Extract raw base64 data (remove data:image/... prefix)
                const rawBase64 = expense.imageBase64.replace(/^data:image\/\w+;base64,/, '');
                await FileSystem.writeAsStringAsync(filePath, rawBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                });
            } else if (expense.imageUri) {
                if (expense.imageUri.startsWith('http')) {
                    await FileSystem.downloadAsync(expense.imageUri, filePath);
                } else {
                    // Local file — copy to cache for sharing
                    await FileSystem.copyAsync({ from: expense.imageUri, to: filePath });
                }
            }

            // Share/save the file
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

    // Determine image source: prefer base64, fallback to URI
    const imageSource = expense.imageBase64
        ? { uri: expense.imageBase64 }
        : expense.imageUri
            ? { uri: expense.imageUri }
            : null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Fiş Detayı</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Amount Card */}
                <GradientCard
                    gradient={
                        expense.status === 'approved'
                            ? Colors.gradientSuccess
                            : expense.status === 'rejected'
                                ? Colors.gradientDanger
                                : Colors.gradientCard
                    }
                    style={styles.amountCard}
                >
                    <Text style={styles.amountLabel}>Tutar</Text>
                    <Text style={styles.amountValue}>₺{expense.amount.toFixed(2)}</Text>
                    <StatusBadge status={expense.status} />
                </GradientCard>

                {/* Image */}
                {imageSource && (
                    <Image source={imageSource} style={styles.image} resizeMode="cover" />
                )}

                {/* Download Button */}
                {canDownload && (expense.imageBase64 || expense.imageUri) && (
                    <TouchableOpacity
                        style={[styles.downloadBtn, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}
                        onPress={handleDownload}
                        activeOpacity={0.7}
                        disabled={downloading}
                    >
                        <Ionicons
                            name={downloading ? 'hourglass-outline' : 'download-outline'}
                            size={22}
                            color={Colors.primary}
                        />
                        <Text style={[styles.downloadText, { color: Colors.primary }]}>
                            {downloading ? 'İndiriliyor...' : 'Fişi İndir / Paylaş'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Details */}
                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <DetailRow icon="person-outline" label="Yükleyen" value={expense.userName} colors={colors} />
                    <DetailRow icon="calendar-outline" label="Tarih" value={expense.date} colors={colors} />
                    <DetailRow icon="document-text-outline" label="Açıklama" value={expense.description || '-'} colors={colors} />
                    <DetailRow icon="time-outline" label="Oluşturulma" value={new Date(expense.createdAt).toLocaleDateString('tr-TR')} colors={colors} />
                    {expense.reviewedBy && (
                        <DetailRow icon="checkmark-circle-outline" label="İnceleyen" value={reviewerName || expense.reviewedBy} colors={colors} />
                    )}
                    {expense.reviewNote ? (
                        <DetailRow icon="chatbubble-outline" label="Not" value={expense.reviewNote} colors={colors} />
                    ) : null}
                </View>

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
    amountCard: { alignItems: 'center', gap: 8, marginBottom: Spacing.xl },
    amountLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
    amountValue: { color: '#FFF', fontSize: 36, fontWeight: '800' },
    image: {
        width: '100%',
        height: 250,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: 8,
        marginBottom: Spacing.xl,
    },
    downloadText: {
        fontSize: 15,
        fontWeight: '700',
    },
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
