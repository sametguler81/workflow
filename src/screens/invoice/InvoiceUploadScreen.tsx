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
    const [amount, setAmount] = useState(invoiceToEdit?.amount.toString() || '');
    const [date, setDate] = useState(() => {
        if (invoiceToEdit?.date) return invoiceToEdit.date;
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    });
    const [dueDate, setDueDate] = useState(invoiceToEdit?.dueDate || '');
    const [description, setDescription] = useState(invoiceToEdit?.description || '');
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState(invoiceToEdit ? 'Mevcut Belge' : '');
    const [fileType, setFileType] = useState<'image' | 'pdf'>('image');

    useEffect(() => {
        if (invoiceToEdit) {
            setDocumentType(invoiceToEdit.documentType);
            setCategory(invoiceToEdit.category);
            setImageUri(invoiceToEdit.imageUri || invoiceToEdit.imageBase64 || '');
            setAmount(invoiceToEdit.amount.toString());
            setDate(invoiceToEdit.date);
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
            setDueDate('');
            setDescription('');
            setFileName('');
        }
    }, [invoiceToEdit, direction]);

    const handlePickFile = async (source: 'camera' | 'document') => {
        try {
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Kamera erişim izni gereklidir.');
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.5,
                    allowsEditing: false, // Sometimes allowsEditing causes crashes on Android
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    setImageUri(result.assets[0].uri);
                    setFileName(`camera_${Date.now()}.jpg`);
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
        } catch (err) {
            console.error('File pick error:', err);
            Alert.alert('Hata', 'Dosya seçilemedi.');
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) {
            Alert.alert('Uyarı', 'Lütfen belge ekleyin.');
            return;
        }
        if (!amount || isNaN(Number(amount))) {
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
            let base64 = invoiceToEdit?.imageBase64;

            if (imageUri && imageUri !== invoiceToEdit?.imageBase64 && imageUri !== invoiceToEdit?.imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            if (invoiceToEdit) {
                await updateInvoice(invoiceToEdit.id, {
                    documentType: documentType || 'fatura',
                    amount: parseFloat(amount) || 0,
                    description: (description || fileName) || '',
                    date: date || new Date().toISOString(),
                    direction: direction || 'expense',
                    category: category || 'Diğer',
                    imageBase64: base64 ?? null,
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
                    amount: parseFloat(amount),
                    description: description || fileName, // Use filename as fallback desc
                    imageUri: '', // We use base64 mostly
                    imageBase64: base64,
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {invoiceToEdit
                                ? 'Belge Düzenle'
                                : (direction === 'income' ? 'Gelir Ekle' : 'Gider Ekle')}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.form}>
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
                                    style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                    onPress={() => handlePickFile('camera')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.pickerIcon, { backgroundColor: Colors.primary + '15' }]}>
                                        <Ionicons name="camera" size={28} color={Colors.primary} />
                                    </View>
                                    <Text style={[styles.pickerLabel, { color: colors.text }]}>Kamera</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                    onPress={() => handlePickFile('document')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.pickerIcon, { backgroundColor: Colors.accent + '15' }]}>
                                        <Ionicons name="document-text" size={28} color={Colors.accent} />
                                    </View>
                                    <Text style={[styles.pickerLabel, { color: colors.text }]}>Belge</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Amount */}
                        <InputField
                            label="Tutar (₺)"
                            icon="cash-outline"
                            placeholder="0.00"
                            value={amount}
                            onChangeText={setAmount}
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
                            title={loading ? 'İşleniyor...' : (invoiceToEdit ? 'Güncelle' : 'Kaydet')}
                            onPress={handleSubmit}
                            loading={loading}
                            size="lg"
                            icon={<Ionicons name="cloud-upload" size={18} color="#FFF" />}
                            style={{ marginTop: Spacing.lg }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
});
