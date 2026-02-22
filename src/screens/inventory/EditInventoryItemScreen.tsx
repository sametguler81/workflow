import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getInventoryItemById,
    updateInventoryItem,
    ItemCategory,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
} from '../../services/inventoryService';

interface EditInventoryItemScreenProps {
    itemId: string;
    onBack: () => void;
    onSuccess: () => void;
}

const CATEGORIES: ItemCategory[] = ['elektronik', 'araç', 'mobilya', 'ekipman', 'diger'];

// ─── Kategoriye özel alan tanımları ──────────────────────
interface FieldDef {
    key: string;
    label: string;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

const CATEGORY_FIELDS: Record<ItemCategory, FieldDef[]> = {
    elektronik: [
        { key: 'brand', label: 'Marka', placeholder: 'ör: Apple, Samsung' },
        { key: 'model', label: 'Model', placeholder: 'ör: MacBook Pro 14' },
        { key: 'serialNumber', label: 'Seri No', placeholder: 'ör: C02X0123ABC' },
        { key: 'warrantyEnd', label: 'Garanti Bitiş', placeholder: 'ör: 2027-01-15' },
    ],
    araç: [
        { key: 'plate', label: 'Plaka', placeholder: 'ör: 34 ABC 123' },
        { key: 'brand', label: 'Marka', placeholder: 'ör: Ford, Renault' },
        { key: 'model', label: 'Model', placeholder: 'ör: Transit, Clio' },
        { key: 'year', label: 'Model Yılı', placeholder: 'ör: 2022', keyboardType: 'numeric' },
        { key: 'color', label: 'Renk', placeholder: 'ör: Beyaz, Siyah' },
        { key: 'vin', label: 'Şase No', placeholder: 'ör: WF0XXXTTGXXX' },
    ],
    mobilya: [
        { key: 'type', label: 'Ürün Tipi', placeholder: 'ör: Ofis Koltuğu, Masa' },
        { key: 'brand', label: 'Marka', placeholder: 'ör: Ofistim, Ikea' },
        { key: 'material', label: 'Malzeme', placeholder: 'ör: Ahşap, Metal, Kumaş' },
        { key: 'color', label: 'Renk', placeholder: 'ör: Siyah, Ceviz' },
        { key: 'dimensions', label: 'Boyut / Ölçü', placeholder: 'ör: 120x80x75 cm' },
    ],
    ekipman: [
        { key: 'brand', label: 'Marka', placeholder: 'ör: Bosch, Makita' },
        { key: 'model', label: 'Model', placeholder: 'ör: GBH 2-26 DFR' },
        { key: 'serialNumber', label: 'Seri No', placeholder: 'ör: 123456789' },
        { key: 'capacity', label: 'Kapasite / Güç', placeholder: 'ör: 800W, 5 Ton' },
        { key: 'location', label: 'Depo / Konum', placeholder: 'ör: Depo A, Kat 2' },
    ],
    diger: [
        { key: 'brand', label: 'Marka', placeholder: 'ör: ...' },
        { key: 'model', label: 'Model / Tip', placeholder: 'ör: ...' },
        { key: 'identifier', label: 'Tanımlayıcı No', placeholder: 'Seri, PLaka vs.' },
    ],
};

export function EditInventoryItemScreen({ itemId, onBack, onSuccess }: EditInventoryItemScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [category, setCategory] = useState<ItemCategory>('elektronik');
    const [attributes, setAttributes] = useState<Record<string, string>>({});
    const [purchaseDate, setPurchaseDate] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadItem = async () => {
            try {
                const item = await getInventoryItemById(itemId);
                if (item) {
                    setName(item.name || '');
                    setCategory(item.category || 'elektronik');
                    setAttributes(item.attributes || {});
                    setPurchaseDate(item.purchaseDate || '');
                    setPurchasePrice(item.purchasePrice ? String(item.purchasePrice) : '');
                    setNotes(item.notes || '');
                }
            } catch (error) {
                console.error('Error loading inventory item:', error);
                Alert.alert('Hata', 'Ürün bilgileri yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };

        if (itemId) {
            loadItem();
        }
    }, [itemId]);

    const setAttribute = (key: string, value: string) => {
        setAttributes(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Hata', 'Ürün adı zorunludur.');
            return;
        }
        setSaving(true);
        try {
            // Filter empty attributes
            const cleanedAttributes: Record<string, string> = {};
            Object.entries(attributes).forEach(([k, v]) => {
                if (v.trim()) cleanedAttributes[k] = v.trim();
            });

            await updateInventoryItem(itemId, {
                name: name.trim(),
                attributes: Object.keys(cleanedAttributes).length > 0 ? cleanedAttributes : undefined,
                purchaseDate: purchaseDate.trim() || undefined,
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
                notes: notes.trim() || undefined,
            });
            Alert.alert('Başarılı', 'Ürün bilgileri güncellendi.', [
                { text: 'Tamam', onPress: onSuccess },
            ]);
        } catch (err) {
            Alert.alert('Hata', 'Ürün güncellenirken bir hata oluştu.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="sync-outline" size={48} color={colors.textTertiary} />
                <Text style={{ color: colors.textSecondary, marginTop: Spacing.md }}>Yükleniyor...</Text>
            </View>
        );
    }

    const fields = CATEGORY_FIELDS[category];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Ürünü Düzenle</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Information Notice */}
                <View style={{ backgroundColor: Colors.warning + '15', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Ionicons name="information-circle" size={20} color={Colors.warning} />
                    <Text style={{ color: Colors.warning, fontSize: 13, flex: 1, fontWeight: '500' }}>
                        Tutarlılığı sağlamak için ürünün mevcut kategorisi ({CATEGORY_LABELS[category]}) değiştirilemez.
                    </Text>
                </View>

                {/* Ürün Adı */}
                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Ürün Bilgisi</Text>
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Ürün Adı</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Ürüne bir isim verin..."
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        />
                    </View>
                </View>

                {/* Kategoriye Özel Alanlar */}
                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {CATEGORY_LABELS[category]} Bilgileri
                    </Text>
                    {fields.map((field, idx) => (
                        <View
                            key={field.key}
                            style={[styles.fieldGroup, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.md }]}
                        >
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{field.label}</Text>
                            <TextInput
                                value={attributes[field.key] || ''}
                                onChangeText={(v) => setAttribute(field.key, v)}
                                placeholder={field.placeholder}
                                placeholderTextColor={colors.textTertiary}
                                keyboardType={field.keyboardType || 'default'}
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            />
                        </View>
                    ))}
                </View>

                {/* Genel Bilgiler */}
                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.md }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Satın Alma Bilgileri</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                            Satın Alma Tarihi <Text style={{ color: colors.textTertiary }}>(opsiyonel)</Text>
                        </Text>
                        <TextInput
                            value={purchaseDate}
                            onChangeText={setPurchaseDate}
                            placeholder="ör: 2024-01-15"
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        />
                    </View>

                    <View style={[styles.fieldGroup, { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.md }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                            Değer (₺) <Text style={{ color: colors.textTertiary }}>(opsiyonel)</Text>
                        </Text>
                        <TextInput
                            value={purchasePrice}
                            onChangeText={setPurchasePrice}
                            placeholder="ör: 45000"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="decimal-pad"
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        />
                    </View>
                </View>

                {/* Notlar */}
                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.md }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        Notlar <Text style={[styles.optional, { color: colors.textTertiary }]}>(opsiyonel)</Text>
                    </Text>
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Ek bilgi, açıklama..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={3}
                        style={[
                            styles.input,
                            styles.textArea,
                            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
                        ]}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: saving ? Colors.primaryLight : Colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#FFF" />
                    <Text style={styles.saveBtnText}>{saving ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: 56,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
    formCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        gap: Spacing.md,
        marginTop: Spacing.md,
        ...Shadows.small,
    },
    cardTitle: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
    fieldGroup: { gap: 6 },
    fieldLabel: { fontSize: 13, fontWeight: '600' },
    optional: { fontWeight: '400' },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        fontSize: 14,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.xl,
        ...Shadows.medium,
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
