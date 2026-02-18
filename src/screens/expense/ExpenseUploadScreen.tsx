import React, { useState } from 'react';
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
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { createExpense } from '../../services/expenseService';

interface ExpenseUploadScreenProps {
    onBack: () => void;
}

export function ExpenseUploadScreen({ onBack }: ExpenseUploadScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [imageUri, setImageUri] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            const permission =
                source === 'camera'
                    ? await ImagePicker.requestCameraPermissionsAsync()
                    : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permission.status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Kamera/galeri erişimi gereklidir.');
                return;
            }

            const result =
                source === 'camera'
                    ? await ImagePicker.launchCameraAsync({
                        mediaTypes: ['images'],
                        quality: 0.4,
                        allowsEditing: true,
                        maxWidth: 800,
                        maxHeight: 800,
                    } as any)
                    : await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        quality: 0.4,
                        allowsEditing: true,
                        maxWidth: 800,
                        maxHeight: 800,
                    } as any);

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
            }
        } catch (err) {
            Alert.alert('Hata', 'Fotoğraf seçilemedi.');
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) {
            Alert.alert('Uyarı', 'Lütfen bir fiş/fatura fotoğrafı ekleyin.');
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
            // Convert image to base64 for Firestore storage
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const imageBase64 = base64;

            await createExpense({
                userId: profile.uid,
                userName: profile.displayName,
                companyId: profile.companyId,
                amount: parseFloat(amount),
                description,
                imageUri: '', // no remote URI needed
                imageBase64,
                date,
            });

            Alert.alert('Başarılı ✅', 'Fiş/fatura yüklendi.', [
                { text: 'Tamam', onPress: onBack },
            ]);
        } catch (err) {
            console.error('Expense upload error:', err);
            Alert.alert('Hata', 'Fiş yüklenemedi.');
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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Fiş / Fatura Yükle</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.form}>
                        {/* Image Picker */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Fotoğraf</Text>
                        {imageUri ? (
                            <TouchableOpacity onPress={() => setImageUri('')} activeOpacity={0.8}>
                                <Image source={{ uri: imageUri }} style={styles.preview} />
                                <View style={styles.removeBtn}>
                                    <Ionicons name="close-circle" size={28} color={Colors.danger} />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.pickerRow}>
                                <TouchableOpacity
                                    style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                                    onPress={() => pickImage('camera')}
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
                                    onPress={() => pickImage('gallery')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.pickerIcon, { backgroundColor: Colors.accent + '15' }]}>
                                        <Ionicons name="images" size={28} color={Colors.accent} />
                                    </View>
                                    <Text style={[styles.pickerLabel, { color: colors.text }]}>Galeri</Text>
                                    <Text style={[styles.pickerSub, { color: colors.textTertiary }]}>Seç</Text>
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
                            title={loading ? 'Yükleniyor...' : 'Fiş Yükle'}
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
    preview: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
});
