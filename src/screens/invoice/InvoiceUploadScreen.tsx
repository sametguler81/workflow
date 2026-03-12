import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    createInvoice,
    updateInvoice,
    Invoice,
    DocumentType,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_TYPE_ICONS,
} from '../../services/invoiceService';
import { getCompany, Company } from '../../services/companyService';
import { PLAN_DETAILS } from '../../constants/plans';
import { createAnnouncement } from '../../services/announcementService';
import { formatCurrencyInput, parseCurrencyToFloat } from '../../utils/currencyFormatter';
import { CurrencySelector } from '../../components/CurrencySelector';
import { CurrencyCode } from '../../services/currencyService';

interface InvoiceUploadScreenProps {
    onBack: () => void;
    route?: any; // To receive params
}

const DOC_TYPES: DocumentType[] = ['fatura', 'makbuz', 'sozlesme', 'diger'];
const CATEGORIES = {
    income: ['Satış', 'Hizmet', 'Proje', 'Diğer'],
    expense: ['Kira', 'Demirbaş', 'Yazılım', 'Vergi', 'Diğer']
};

export function InvoiceUploadScreen({ onBack, route }: InvoiceUploadScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const invoiceToEdit = route?.params?.invoice as Invoice | undefined;

    // Use direction from edit object if available, otherwise fallback to route params or default
    const direction = invoiceToEdit?.direction || route?.params?.type || 'income';

    const [documentType, setDocumentType] = useState<DocumentType>(invoiceToEdit?.documentType || 'fatura');
    const [category, setCategory] = useState(invoiceToEdit?.category || CATEGORIES[direction as keyof typeof CATEGORIES][0]);
    const [imageUri, setImageUri] = useState(invoiceToEdit?.imageUri || (invoiceToEdit?.imageBase64 || ''));
    const [amount, setAmount] = useState(
        invoiceToEdit?.amount ? formatCurrencyInput(invoiceToEdit.amount.toString().replace('.', ',')) : ''
    );
    const [date, setDate] = useState(() => {
        if (invoiceToEdit?.date) return invoiceToEdit.date;
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    });
    const [currency, setCurrency] = useState<CurrencyCode>(invoiceToEdit?.currency || 'TRY');
    const [dueDate, setDueDate] = useState(invoiceToEdit?.dueDate || '');
    const [description, setDescription] = useState(invoiceToEdit?.description || '');
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState(invoiceToEdit ? 'Mevcut Belge' : '');
    const [fileType, setFileType] = useState<'image' | 'pdf'>('image');

    // Limits State
    const [companyDetails, setCompanyDetails] = useState<Company | null>(null);

    useEffect(() => {
        if (profile?.companyId) {
            getCompany(profile.companyId)
                .then(setCompanyDetails)
                .catch(err => console.error("Failed to load company limits for invoice screen", err));
        }
    }, [profile?.companyId]);

    useEffect(() => {
        if (invoiceToEdit) {
            setDocumentType(invoiceToEdit.documentType);
            setCategory(invoiceToEdit.category);
            setImageUri(invoiceToEdit.imageUri || invoiceToEdit.imageBase64 || '');
            setAmount(invoiceToEdit.amount ? formatCurrencyInput(invoiceToEdit.amount.toString().replace('.', ',')) : '');
            setDate(invoiceToEdit.date);
            setCurrency(invoiceToEdit.currency || 'TRY');
            setDueDate(invoiceToEdit.dueDate || '');
            setDescription(invoiceToEdit.description || '');
            setFileName('Mevcut Belge');
        } else {
            setDocumentType('fatura');
            setCategory(CATEGORIES[direction as keyof typeof CATEGORIES][0]);
            setImageUri('');
            setAmount('');
            const d = new Date();
            setDate(`${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`);
            setCurrency('TRY');
            setDueDate('');
            setDescription('');
            setFileName('');
        }
    }, [invoiceToEdit, direction]);

    const handlePickFile = async (source: 'camera' | 'gallery' | 'document') => {
        try {
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Kamera erişim izni gereklidir.');
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.3, // Compressed for upload
                    allowsEditing: false,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    setImageUri(result.assets[0].uri);
                    setFileName(`camera_${Date.now()}.jpg`);
                    setFileType('image');
                }
            } else if (source === 'gallery') {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Galeri erişim izni gereklidir.');
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.3, // Compressed for upload
                    allowsEditing: false,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    setImageUri(result.assets[0].uri);
                    setFileName(`gallery_${Date.now()}.jpg`);
                    setFileType('image');
                }
            } else {
                // Document Picker
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'application/pdf'],
                    copyToCacheDirectory: true,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const asset = result.assets[0];
                    setImageUri(asset.uri);
                    setFileName(asset.name);
                    setFileType(asset.mimeType?.includes('pdf') ? 'pdf' : 'image');
                }
            }
        } catch (err: any) {
            if (err.message && err.message.includes('Camera not available on simulator')) {
                console.log('Warn: Camera not available on simulator.');
                Alert.alert('Uyarı', 'Kamera simülatörde kullanılamaz. Lütfen test için "Galeri" veya "Belge" seçeneğini kullanın.');
            } else {
                console.error('File pick error:', err);
                Alert.alert('Hata', 'Dosya seçilemedi.');
            }
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) {
            Alert.alert('Uyarı', 'Lütfen belge ekleyin.');
            return;
        }
        const numericAmount = parseCurrencyToFloat(amount);
        if (!amount || numericAmount <= 0) {
            Alert.alert('Uyarı', 'Geçerli bir tutar girin.');
            return;
        }
        if (!date) {
            Alert.alert('Uyarı', 'Tarih alanı gerekli.');
            return;
        }
        if (!profile) return;

        setLoading(true);
        try {
            // Note: We no longer convert to base64 here. We rely on passing the local imageUri 
            // to the service, which will handle uploading it to Firebase Storage.
            // When editing an existing invoice without changing the image, `imageUri` will be 
            // the existing URL or Base64 string from Firestore.


            if (invoiceToEdit) {
                await updateInvoice(invoiceToEdit.id, {
                    documentType: documentType || 'fatura',
                    amount: numericAmount,
                    currency,
                    description: (description || fileName) || '',
                    date: date || new Date().toISOString(),
                    direction: direction || 'expense',
                    category: category || 'Diğer',
                    imageUri: imageUri !== invoiceToEdit.imageUri && invoiceToEdit.imageBase64 !== imageUri ? imageUri : undefined, // Pass if changed
                    dueDate: dueDate ?? null,
                });
                Alert.alert('Başarılı', 'Belge güncellendi.', [
                    { text: 'Tamam', onPress: onBack },
                ]);
            } else {
                await createInvoice({
                    userId: profile.uid,
                    userName: profile.displayName,
                    companyId: profile.companyId,
                    documentType,
                    amount: numericAmount,
                    currency,
                    description: description || fileName, // Use filename as fallback desc
                    imageUri: imageUri, // Pass the local file URI, the service will upload it
                    date,
                    direction: direction,
                    category,
                    paymentStatus: 'unpaid', // Default
                    dueDate: dueDate || undefined,
                });
                Alert.alert('Başarılı', 'Belge başarıyla yüklendi.', [
                    { text: 'Tamam', onPress: onBack },
                ]);
            }
        } catch (err) {
            console.error('Invoice upload error:', err);
            Alert.alert('Hata', 'İşlem başarısız.');
        } finally {
            setLoading(false);
        }
    };

    const isFreePlanAndLimited = () => {
        if (!companyDetails) return false;
        const currentPlan = PLAN_DETAILS[companyDetails.plan || 'free'];

        if (currentPlan.storageLimit !== -1) {
            const usedBytes = companyDetails.usedStorage || 0;
            const limitBytes = currentPlan.storageLimit;
            const usedMB = usedBytes / (1024 * 1024);
            const limitGB = limitBytes / (1024 * 1024 * 1024);

            return {
                isLimited: true,
                usedText: `${usedMB.toFixed(1)} MB`,
                limitText: `${limitGB.toFixed(0)} GB`,
                used: usedBytes,
                limit: limitBytes,
                percentage: Math.min((usedBytes / limitBytes) * 100, 100)
            };
        }
        return false;
    };

    const quotaInfo = isFreePlanAndLimited();

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {invoiceToEdit
                        ? 'Belge Düzenle'
                        : (direction === 'income' ? 'Gelir Ekle' : 'Gider Ekle')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {!!(quotaInfo && typeof quotaInfo === 'object' && quotaInfo.isLimited) ? (
                    <View style={[styles.quotaBanner, { backgroundColor: Colors.danger + '10', borderColor: Colors.danger + '30', borderWidth: 1 }]}>
                        <View style={styles.quotaHeader}>
                            <Ionicons name="cloud-outline" size={20} color={Colors.danger} />
                            <Text style={[styles.quotaTitle, { color: Colors.danger }]}>
                                {quotaInfo.used >= quotaInfo.limit ? 'Depolama Alanı Doldu!' : 'Başlangıç Planı Depolama Sınırı'}
                            </Text>
                        </View>
                        <Text style={[styles.quotaSubText, { color: colors.textSecondary }]}>
                            {quotaInfo.usedText} / {quotaInfo.limitText} Kullanıldı
                        </Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${quotaInfo.percentage}%`, backgroundColor: quotaInfo.percentage >= 100 ? Colors.danger : Colors.warning }]} />
                        </View>
                    </View>
                ) : null}

                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={styles.formSection}>
                        {/* Category Selector */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.xl }}>
                            {CATEGORIES[direction as keyof typeof CATEGORIES].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 8,
                                        borderRadius: 20,
                                        backgroundColor: category === cat ? Colors.primary : colors.card,
                                        marginRight: 8,
                                        borderWidth: 1,
                                        borderColor: category === cat ? Colors.primary : colors.borderLight
                                    }}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={{ color: category === cat ? '#FFF' : colors.text, fontSize: 13, fontWeight: '600' }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Document Type Selector */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Belge Türü</Text>
                        <View style={styles.typeRow}>
                            {DOC_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeCard,
                                        {
                                            backgroundColor: documentType === type ? Colors.primary + '15' : colors.card,
                                            borderColor: documentType === type ? Colors.primary : colors.borderLight,
                                        },
                                    ]}
                                    onPress={() => setDocumentType(type)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={DOCUMENT_TYPE_ICONS[type] as any}
                                        size={22}
                                        color={documentType === type ? Colors.primary : colors.textTertiary}
                                    />
                                    <Text
                                        style={[
                                            styles.typeLabel,
                                            {
                                                color: documentType === type ? Colors.primary : colors.text,
                                                fontWeight: documentType === type ? '700' : '500',
                                            },
                                        ]}
                                    >
                                        {DOCUMENT_TYPE_LABELS[type]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* File Picker */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Belge / Fotoğraf</Text>
                        {imageUri ? (
                            <View style={{ marginBottom: Spacing.xl }}>
                                <TouchableOpacity
                                    onPress={() => { setImageUri(''); setFileName(''); }}
                                    activeOpacity={0.8}
                                    style={{ position: 'relative' }}
                                >
                                    {fileType === 'pdf' ? (
                                        <View style={[styles.previewPlaceholder, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                                            <Ionicons name="document-text" size={48} color={Colors.primary} />
                                            <Text style={[styles.fileName, { color: colors.text }]}>{fileName}</Text>
                                        </View>
                                    ) : (
                                        <Image source={{ uri: imageUri }} style={styles.preview} />
                                    )}
                                    <View style={styles.removeBtn}>
                                        <Ionicons name="close-circle" size={28} color={Colors.danger} />
                                    </View>
                                </TouchableOpacity>
                                <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textTertiary, marginTop: -10 }}>
                                    Değiştirmek için görselin üzerine tıklayın
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.pickerRow}>
                                <TouchableOpacity
                                    style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.borderLight, padding: Spacing.md }]}
                                    onPress={() => handlePickFile('camera')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.pickerIcon, { backgroundColor: Colors.primary + '15', width: 48, height: 48, borderRadius: 16 }]}>
                                        <Ionicons name="camera" size={24} color={Colors.primary} />
                                    </View>
                                    <Text style={[styles.pickerLabel, { color: colors.text, fontSize: 13 }]}>Kamera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.borderLight, padding: Spacing.md }]}
                                    onPress={() => handlePickFile('gallery')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.pickerIcon, { backgroundColor: Colors.info + '15', width: 48, height: 48, borderRadius: 16 }]}>
                                        <Ionicons name="images" size={24} color={Colors.info} />
                                    </View>
                                    <Text style={[styles.pickerLabel, { color: colors.text, fontSize: 13 }]}>Galeri</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.borderLight, padding: Spacing.md }]}
                                    onPress={() => handlePickFile('document')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.pickerIcon, { backgroundColor: Colors.accent + '15', width: 48, height: 48, borderRadius: 16 }]}>
                                        <Ionicons name="document-text" size={24} color={Colors.accent} />
                                    </View>
                                    <Text style={[styles.pickerLabel, { color: colors.text, fontSize: 13 }]}>Belge</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Currency Selector */}
                        <CurrencySelector value={currency} onChange={setCurrency} />

                        {/* Amount */}
                        <InputField
                            label={`Tutar (${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺'})`}
                            icon="cash-outline"
                            placeholder="0.00"
                            value={amount}
                            onFocus={() => {
                                setAmount(amount.replace(/\./g, ''));
                            }}
                            onChangeText={(text) => {
                                setAmount(text.replace('.', ','));
                            }}
                            onBlur={() => {
                                setAmount(formatCurrencyInput(amount));
                            }}
                            keyboardType="decimal-pad"
                        />

                        {/* Date */}
                        <InputField
                            label="Tarih"
                            icon="calendar-outline"
                            placeholder="GG.AA.YYYY"
                            value={date}
                            onChangeText={setDate}
                        />

                        {/* Description */}
                        <InputField
                            label="Açıklama"
                            icon="document-text-outline"
                            placeholder="Belge açıklaması..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top', paddingTop: 12 }}
                        />

                        {/* Submit */}
                        <PremiumButton
                            title={!!(quotaInfo && typeof quotaInfo === 'object' && quotaInfo.isLimited && quotaInfo.used >= quotaInfo.limit)
                                ? 'Limit Doldu'
                                : (loading ? 'İşleniyor...' : (invoiceToEdit ? 'Güncelle' : 'Kaydet'))}
                            onPress={handleSubmit}
                            loading={loading}
                            disabled={!!(quotaInfo && typeof quotaInfo === 'object' && quotaInfo.isLimited && quotaInfo.used >= quotaInfo.limit)}
                            size="lg"
                            icon={<Ionicons name="cloud-upload" size={18} color="#FFF" />}
                            style={{
                                marginTop: Spacing.lg,
                                opacity: !!(quotaInfo && typeof quotaInfo === 'object' && quotaInfo.isLimited && quotaInfo.used >= quotaInfo.limit) ? 0.6 : 1
                            }}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    form: { padding: Spacing.xl },
    label: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, letterSpacing: 0.3 },

    // Type selector
    typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl, flexWrap: 'wrap' },
    typeCard: {
        flex: 1,
        minWidth: '22%',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        gap: 4,
    },
    typeLabel: { fontSize: 11, textAlign: 'center' },

    // Image picker
    pickerRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    pickerCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        gap: 6,
        ...Shadows.small,
    },
    pickerIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    pickerLabel: { fontSize: 14, fontWeight: '700' },
    pickerSub: { fontSize: 12 },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.xl,
    },
    previewPlaceholder: {
        width: '100%',
        height: 150,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '600',
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        backgroundColor: '#FFF',
        borderRadius: 14,
    },
    formCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
        marginBottom: Spacing.xl,
    },
    formSection: {
        marginBottom: Spacing.md,
    },
    quotaBanner: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
    },
    quotaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    quotaTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginLeft: Spacing.sm,
    },
    quotaSubText: {
        fontSize: 13,
        marginBottom: Spacing.md,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});
