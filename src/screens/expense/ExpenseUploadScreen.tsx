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
import { createExpense, updateExpense, Expense } from '../../services/expenseService';

interface ExpenseUploadScreenProps {
    onBack: () => void;
    route?: any;
}

export function ExpenseUploadScreen({ onBack, route }: ExpenseUploadScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const expenseToEdit = route?.params?.expense as Expense | undefined;

    const [imageUri, setImageUri] = useState(expenseToEdit?.imageUri || (expenseToEdit?.imageBase64 || ''));
    const [amount, setAmount] = useState(expenseToEdit?.amount.toString() || '');
    const [date, setDate] = useState(() => {
        if (expenseToEdit?.date) return expenseToEdit.date;
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    });
    const [description, setDescription] = useState(expenseToEdit?.description || '');
    const [paymentMethod, setPaymentMethod] = useState<'personal' | 'company_card'>(expenseToEdit?.paymentMethod || 'personal');
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState(expenseToEdit ? 'Mevcut Belge' : '');
    const [fileType, setFileType] = useState<'image' | 'pdf'>('image');

    useEffect(() => {
        if (expenseToEdit) {
            setImageUri(expenseToEdit.imageUri || expenseToEdit.imageBase64 || '');
            setAmount(expenseToEdit.amount.toString());
            setDate(expenseToEdit.date);
            setDescription(expenseToEdit.description || '');
            setPaymentMethod(expenseToEdit.paymentMethod || 'personal');
            setFileName('Mevcut Belge');
        } else {
            // Reset form if no expense to edit (e.g. going from Edit -> New)
            setImageUri('');
            setAmount('');
            const d = new Date();
            setDate(`${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`);
            setDescription('');
            setPaymentMethod('personal');
            setFileName('');
        }
    }, [expenseToEdit]);

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
                    allowsEditing: false,
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
        } catch (err: any) {
            console.error('File pick error:', err);
            if (err.message && err.message.includes('Camera not available on simulator')) {
                Alert.alert('Uyarı', 'Kamera simülatörde kullanılamaz. Lütfen test için "Belge" seçeneğini kullanın.');
            } else {
                Alert.alert('Hata', 'Dosya seçilemedi.');
            }
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
            let base64 = expenseToEdit?.imageBase64; // Keep existing base64 if not changed

            // If imageUri changed (it's a new file path or different from initial), convert new one
            // Note: If imageUri is same as initial expense.imageBase64, we don't need to fetch
            if (imageUri && imageUri !== expenseToEdit?.imageBase64 && imageUri !== expenseToEdit?.imageUri) {
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

            if (expenseToEdit) {
                await updateExpense(expenseToEdit.id, {
                    amount: parseFloat(amount) || 0,
                    description: (description || fileName) || '',
                    date: date || new Date().toISOString(),
                    paymentMethod: paymentMethod || 'personal',
                    imageBase64: base64 ?? null,
                });
                Alert.alert('Başarılı ✅', 'Fiş güncellendi.', [
                    { text: 'Tamam', onPress: onBack },
                ]);
            } else {
                await createExpense({
                    userId: profile.uid,
                    userName: profile.displayName,
                    companyId: profile.companyId,
                    amount: parseFloat(amount),
                    description: description || fileName, // Use filename as fallback desc
                    imageUri: '', // no remote URI needed
                    imageBase64: base64 || null,
                    date,
                    paymentMethod,
                });
                Alert.alert('Başarılı ✅', 'Fiş/fatura yüklendi.', [
                    { text: 'Tamam', onPress: onBack },
                ]);
            }
        } catch (err) {
            console.error('Expense upload error:', err);
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
                            {expenseToEdit ? 'Fiş Düzenle' : 'Fiş / Fatura Yükle'}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.form}>
                        {/* Payment Method Selection */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Ödeme Yöntemi</Text>
                        <View style={styles.methodRow}>
                            <TouchableOpacity
                                style={[
                                    styles.methodCard,
                                    paymentMethod === 'personal' && { backgroundColor: Colors.primary + '15', borderColor: Colors.primary },
                                    { borderColor: colors.borderLight }
                                ]}
                                onPress={() => setPaymentMethod('personal')}
                            >
                                <Ionicons
                                    name={paymentMethod === 'personal' ? "radio-button-on" : "radio-button-off"}
                                    size={20}
                                    color={paymentMethod === 'personal' ? Colors.primary : colors.textTertiary}
                                />
                                <Text style={[styles.methodText, { color: colors.text }]}>Kendi Cebimden</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.methodCard,
                                    paymentMethod === 'company_card' && { backgroundColor: Colors.warning + '15', borderColor: Colors.warning },
                                    { borderColor: colors.borderLight }
                                ]}
                                onPress={() => setPaymentMethod('company_card')}
                            >
                                <Ionicons
                                    name={paymentMethod === 'company_card' ? "radio-button-on" : "radio-button-off"}
                                    size={20}
                                    color={paymentMethod === 'company_card' ? Colors.warning : colors.textTertiary}
                                />
                                <Text style={[styles.methodText, { color: colors.text }]}>Şirket Kartı</Text>
                            </TouchableOpacity>
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
                                    <Text style={[styles.pickerSub, { color: colors.textTertiary }]}>Fotoğraf çek</Text>
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
                            placeholder="Fiş açıklaması..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top', paddingTop: 12 }}
                        />

                        {/* Submit */}
                        <PremiumButton
                            title={loading ? 'İşleniyor...' : (expenseToEdit ? 'Güncelle' : 'Kaydet')}
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

    // Payment Method Styles
    methodRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    methodCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: 8,
    },
    methodText: { fontSize: 13, fontWeight: '600' },

    preview: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
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
