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
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    createItemWithAssignments,
    ItemCategory,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
} from '../../services/inventoryService';
import { getCompanyMembers } from '../../services/companyService';

interface AddInventoryItemScreenProps {
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

export function AddInventoryItemScreen({ onBack, onSuccess }: AddInventoryItemScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();

    const [name, setName] = useState('');
    const [category, setCategory] = useState<ItemCategory>('elektronik');
    const [attributes, setAttributes] = useState<Record<string, string>>({});
    const [purchaseDate, setPurchaseDate] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // Multi-select for assignees
    const [members, setMembers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<{ uid: string; displayName: string }[]>([]);
    const [assignModalVisible, setAssignModalVisible] = useState(false);

    useEffect(() => {
        if (!profile) return;
        getCompanyMembers(profile.companyId)
            .then(data => {
                setMembers(data.filter((m: any) => ['personel', 'muhasebe', 'idari', 'admin'].includes(m.role)));
            })
            .catch(err => console.error('Error fetching members:', err));
    }, [profile]);

    // Kategori değişince attribute'ları sıfırla
    const handleCategoryChange = (cat: ItemCategory) => {
        setCategory(cat);
        setAttributes({});
    };

    const setAttribute = (key: string, value: string) => {
        setAttributes(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!profile) return;
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

            await createItemWithAssignments(
                {
                    companyId: profile.companyId,
                    name: name.trim(),
                    category,
                    attributes: Object.keys(cleanedAttributes).length > 0 ? cleanedAttributes : undefined,
                    purchaseDate: purchaseDate.trim() || undefined,
                    purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
                    notes: notes.trim() || undefined,
                    createdBy: profile.uid,
                },
                selectedUsers,
                profile.uid,
                profile.displayName,
                'İlk kayıt esnasında zimmetlendi.'
            );
            Alert.alert('Başarılı', 'Ürün envantere eklendi.', [
                { text: 'Tamam', onPress: onSuccess },
            ]);
        } catch (err) {
            Alert.alert('Hata', 'Ürün eklenirken bir hata oluştu.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const fields = CATEGORY_FIELDS[category];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni Ürün Ekle</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
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

                {/* Kategori Seçici */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: category === cat ? Colors.primary : colors.surface,
                                    borderColor: category === cat ? Colors.primary : colors.border,
                                },
                            ]}
                            onPress={() => handleCategoryChange(cat)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={CATEGORY_ICONS[cat] as any}
                                size={16}
                                color={category === cat ? '#FFF' : colors.textSecondary}
                            />
                            <Text style={[styles.categoryChipText, { color: category === cat ? '#FFF' : colors.textSecondary }]}>
                                {CATEGORY_LABELS[cat]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

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

                {/* Zimmetleme Bölümü */}
                <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.md }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            Kime Zimmetlenecek? <Text style={[styles.optional, { color: colors.textTertiary }]}>(opsiyonel)</Text>
                        </Text>
                        <TouchableOpacity onPress={() => setAssignModalVisible(true)} style={styles.addAssigneeBtn}>
                            <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
                            <Text style={[styles.addAssigneeText, { color: Colors.primary }]}>Kişi Seç</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedUsers.length > 0 ? (
                        <View style={styles.selectedUsersContainer}>
                            {selectedUsers.map(user => (
                                <View key={user.uid} style={[styles.selectedUserChip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                                    <Text style={[styles.selectedUserText, { color: Colors.primary }]}>{user.displayName}</Text>
                                    <TouchableOpacity
                                        onPress={() => setSelectedUsers(prev => prev.filter(u => u.uid !== user.uid))}
                                        style={{ padding: 2 }}
                                    >
                                        <Ionicons name="close-circle" size={16} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={[styles.noAssigneeText, { color: colors.textTertiary }]}>
                            Seçim yapılmazsa ürün "Müsait" olarak kaydedilir.
                        </Text>
                    )}
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: saving ? Colors.primaryLight : Colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#FFF" />
                    <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Envantere Ekle'}</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Assignees Modal */}
            <Modal visible={assignModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Zimmetlenecek Kişileri Seçin</Text>

                        <FlatList
                            data={members}
                            keyExtractor={m => m.uid}
                            style={{ maxHeight: 300, marginBottom: Spacing.md }}
                            renderItem={({ item: member }) => {
                                const isSelected = selectedUsers.some(u => u.uid === member.uid);
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.memberRow,
                                            {
                                                backgroundColor: isSelected ? Colors.primary + '15' : colors.surface,
                                                borderColor: isSelected ? Colors.primary : colors.borderLight,
                                            }
                                        ]}
                                        onPress={() => {
                                            if (isSelected) {
                                                setSelectedUsers(prev => prev.filter(u => u.uid !== member.uid));
                                            } else {
                                                setSelectedUsers(prev => [...prev, { uid: member.uid, displayName: member.displayName }]);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.memberAvatar, { backgroundColor: Colors.primary + '20' }]}>
                                            <Text style={[styles.memberAvatarText, { color: Colors.primary }]}>
                                                {member.displayName[0]?.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.memberName, { color: colors.text }]}>{member.displayName}</Text>
                                            <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                                                {member.role === 'admin' ? 'İdari' : member.role === 'personel' ? 'Personel' : member.role === 'muhasebe' ? 'Muhasebe' : 'İdari'}
                                            </Text>
                                        </View>
                                        <View style={[styles.checkbox, {
                                            backgroundColor: isSelected ? Colors.primary : 'transparent',
                                            borderColor: isSelected ? Colors.primary : colors.border
                                        }]}>
                                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: Colors.primary, marginTop: 0 }]}
                            onPress={() => setAssignModalVisible(false)}
                        >
                            <Text style={styles.saveBtnText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
        marginHorizontal: 2,
    },
    categoryRow: { gap: Spacing.sm, marginBottom: Spacing.sm },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    categoryChipText: { fontSize: 13, fontWeight: '600' },
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
    addAssigneeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: Colors.primary + '10' },
    addAssigneeText: { fontSize: 13, fontWeight: '600' },
    selectedUsersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.sm },
    selectedUserChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
    selectedUserText: { fontSize: 13, fontWeight: '600' },
    noAssigneeText: { fontSize: 13, fontStyle: 'italic', marginTop: Spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: Spacing.lg },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.md, letterSpacing: -0.3 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm },
    memberAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    memberAvatarText: { fontSize: 15, fontWeight: '800' },
    memberName: { fontSize: 14, fontWeight: '600' },
    memberRole: { fontSize: 12 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
});
