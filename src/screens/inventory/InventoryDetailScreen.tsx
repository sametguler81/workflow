import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Modal,
    FlatList,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getInventoryItemById,
    getItemAssignmentHistory,
    getActiveAssignmentsForItem,
    assignItem,
    returnItem,
    InventoryItem,
    Assignment,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
    STATUS_LABELS,
    STATUS_COLORS,
} from '../../services/inventoryService';
import { getCompanyMembers } from '../../services/companyService';

interface InventoryDetailScreenProps {
    itemId: string;
    onBack: () => void;
}

export function InventoryDetailScreen({ itemId, onBack }: InventoryDetailScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();

    const [item, setItem] = useState<InventoryItem | null>(null);
    const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
    const [history, setHistory] = useState<Assignment[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [assignmentToReturn, setAssignmentToReturn] = useState<Assignment | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [assignNote, setAssignNote] = useState('');
    const [returnNote, setReturnNote] = useState('');
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const [itemData, activeAss, hist, memberList] = await Promise.all([
                getInventoryItemById(itemId),
                getActiveAssignmentsForItem(itemId),
                getItemAssignmentHistory(itemId),
                getCompanyMembers(profile.companyId),
            ]);
            setItem(itemData);
            setActiveAssignments(activeAss);
            setHistory(hist);
            // Include admin as they represent the 'idari' company owners
            setMembers(memberList.filter((m: any) =>
                ['personel', 'muhasebe', 'idari', 'admin'].includes(m.role)
            ));
        } catch (err) {
            console.error(err);
        }
    }, [itemId, profile]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAssign = async () => {
        if (!selectedUser || !item || !profile) return;
        setSaving(true);
        try {
            await assignItem(
                item.id,
                item.name,
                item.category,
                profile.companyId,
                selectedUser.uid,
                selectedUser.displayName,
                profile.uid,
                profile.displayName,
                assignNote
            );
            setAssignModalVisible(false);
            setSelectedUser(null);
            setAssignNote('');
            await loadData();
            Alert.alert('Başarılı', `"${item.name}" ${selectedUser.displayName} adına zimmetlendi.`);
        } catch (err) {
            Alert.alert('Hata', 'Zimmet işlemi başarısız.');
        } finally {
            setSaving(false);
        }
    };

    const handleReturn = async () => {
        if (!assignmentToReturn || !item) return;
        setSaving(true);
        try {
            await returnItem(assignmentToReturn.id, item.id, returnNote);
            setReturnModalVisible(false);
            setAssignmentToReturn(null);
            setReturnNote('');
            await loadData();
            Alert.alert('Başarılı', `"${item.name}" iade alındı.`);
        } catch (err) {
            Alert.alert('Hata', 'İade işlemi başarısız.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch { return iso; }
    };

    if (!item) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Detay</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={styles.centered}>
                    <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
                    <Text style={{ color: colors.textSecondary, marginTop: Spacing.md }}>Yükleniyor...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Item Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.heroIcon, { backgroundColor: Colors.primary + '15' }]}>
                        <Ionicons name={CATEGORY_ICONS[item.category] as any} size={36} color={Colors.primary} />
                    </View>
                    <Text style={[styles.heroName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.heroCategory, { color: colors.textSecondary }]}>
                        {CATEGORY_LABELS[item.category]}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
                        <Text style={[styles.statusPillText, { color: STATUS_COLORS[item.status] }]}>
                            {STATUS_LABELS[item.status]}
                        </Text>
                    </View>
                </View>

                {/* Details */}
                <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Basic Info */}
                    {[
                        { label: 'Kategori', value: CATEGORY_LABELS[item.category] },
                        { label: 'Durum', value: STATUS_LABELS[item.status] },
                        { label: 'Ekleme Tarihi', value: formatDate(item.createdAt) },
                    ].filter(r => r.value).map((row, idx) => (
                        <View
                            key={row.label}
                            style={[styles.detailRow, idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                        >
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>{row.value}</Text>
                        </View>
                    ))}

                    {/* Dynamic Attributes */}
                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                            <View style={[styles.detailRow, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '700' }]}>Özellikler</Text>
                            </View>
                            {Object.entries(item.attributes).map(([key, value]) => {
                                // Translate keys for display if possible, or just capitalize
                                const keyMap: any = {
                                    brand: 'Marka', model: 'Model', serialNumber: 'Seri No',
                                    plate: 'Plaka', year: 'Yıl', color: 'Renk', vin: 'Şase No',
                                    warrantyEnd: 'Garanti Bitiş', type: 'Tip', material: 'Malzeme',
                                    dimensions: 'Boyutlar', capacity: 'Kapasite', location: 'Konum',
                                    identifier: 'No',
                                };
                                const label = keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
                                return (
                                    <View key={key} style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
                                        <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Financial & Notes */}
                    {(item.purchaseDate || item.purchasePrice || item.notes) && (
                        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                            <View style={[styles.detailRow, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '700' }]}>Ek Bilgiler</Text>
                            </View>
                            {[
                                { label: 'Satın Alma', value: item.purchaseDate },
                                { label: 'Değer', value: item.purchasePrice ? `₺${item.purchasePrice.toLocaleString('tr-TR')}` : undefined },
                            ].filter(r => r.value).map((row, idx) => (
                                <View
                                    key={row.label}
                                    style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
                                >
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                                    <Text style={[styles.detailValue, { color: colors.text }]}>{row.value}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {item.notes ? (
                        <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notlar</Text>
                            <Text style={[styles.detailValue, { color: colors.text, flex: 1, textAlign: 'right' }]}>{item.notes}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Active Assignments */}
                {activeAssignments.length > 0 && (
                    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.detailRow, { backgroundColor: Colors.primary + '10' }]}>
                            <Ionicons name="people-circle-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.detailLabel, { color: Colors.primary, fontWeight: '700', flex: 1, marginLeft: 8 }]}>
                                Aktif Zimmetler ({activeAssignments.length})
                            </Text>
                        </View>
                        {activeAssignments.map((ass, idx) => (
                            <View
                                key={ass.id}
                                style={[
                                    styles.assignmentRow,
                                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight }
                                ]}
                            >
                                <View style={{ flex: 1, paddingRight: Spacing.md }}>
                                    <Text style={[styles.assignmentName, { color: colors.text }]} numberOfLines={1}>
                                        {ass.assignedToName}
                                    </Text>
                                    <Text style={[styles.assignmentDate, { color: colors.textSecondary }]}>
                                        {formatDate(ass.assignedAt)}
                                    </Text>
                                    {ass.notes ? (
                                        <Text style={[styles.assignmentNote, { color: colors.textSecondary }]} numberOfLines={2}>
                                            Not: {ass.notes}
                                        </Text>
                                    ) : null}
                                </View>
                                <TouchableOpacity
                                    style={styles.returnMiniBtn}
                                    onPress={() => {
                                        setAssignmentToReturn(ass);
                                        setReturnModalVisible(true);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="return-down-back-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.returnMiniText}>İade</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => setAssignModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="person-add-outline" size={18} color="#FFF" />
                        <Text style={styles.actionBtnText}>
                            {activeAssignments.length > 0 ? 'Yeni Kişiye Zimmetle' : 'Zimmet Ver'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* History */}
                {history.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Zimmet Geçmişi</Text>
                        {history.map((h, idx) => (
                            <View
                                key={h.id}
                                style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            >
                                <View style={[styles.historyDot, {
                                    backgroundColor: h.status === 'active' ? Colors.primary : Colors.success
                                }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.historyName, { color: colors.text }]}>
                                        {h.assignedToName}
                                    </Text>
                                    <Text style={[styles.historyDates, { color: colors.textSecondary }]}>
                                        {formatDate(h.assignedAt)}
                                        {h.returnedAt ? ` → ${formatDate(h.returnedAt)}` : ' → Devam ediyor'}
                                    </Text>
                                    {h.notes ? <Text style={[styles.historyNote, { color: colors.textTertiary }]}>Not: {h.notes}</Text> : null}
                                </View>
                                <View style={[styles.historyBadge, {
                                    backgroundColor: h.status === 'active' ? Colors.primary + '15' : Colors.success + '15'
                                }]}>
                                    <Text style={[styles.historyBadgeText, {
                                        color: h.status === 'active' ? Colors.primary : Colors.success
                                    }]}>
                                        {h.status === 'active' ? 'Aktif' : 'İade'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Assign Modal */}
            <Modal visible={assignModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Zimmet Verilecek Kişi</Text>

                        <FlatList
                            data={members}
                            keyExtractor={m => m.uid}
                            style={{ maxHeight: 260 }}
                            renderItem={({ item: member }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.memberRow,
                                        {
                                            backgroundColor: selectedUser?.uid === member.uid
                                                ? Colors.primary + '15'
                                                : colors.surface,
                                            borderColor: selectedUser?.uid === member.uid
                                                ? Colors.primary
                                                : colors.borderLight,
                                        }
                                    ]}
                                    onPress={() => setSelectedUser(member)}
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
                                    {activeAssignments.some(a => a.assignedTo === member.uid) ? (
                                        <View style={{ backgroundColor: Colors.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                            <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '700' }}>Zaten Zimmetli</Text>
                                        </View>
                                    ) : selectedUser?.uid === member.uid ? (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                    ) : null}
                                </TouchableOpacity>
                            )}
                        />

                        <TextInput
                            value={assignNote}
                            onChangeText={setAssignNote}
                            placeholder="Not ekle (opsiyonel)"
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                                onPress={() => { setAssignModalVisible(false); setSelectedUser(null); setAssignNote(''); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalCancelText, { color: colors.text }]}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, { backgroundColor: selectedUser ? Colors.primary : colors.border }]}
                                onPress={handleAssign}
                                disabled={!selectedUser || saving}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalConfirmText}>{saving ? 'Kaydediliyor...' : 'Zimmet Ver'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Return Modal */}
            <Modal visible={returnModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />
                        <Text style={[styles.modalTitle, { color: colors.text }]}>İade Al</Text>
                        {assignmentToReturn && (
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                {assignmentToReturn.assignedToName} adlı kişiden "{item.name}" iade alınacak.
                            </Text>
                        )}
                        <TextInput
                            value={returnNote}
                            onChangeText={setReturnNote}
                            placeholder="İade notu (opsiyonel)"
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                                onPress={() => { setReturnModalVisible(false); setAssignmentToReturn(null); setReturnNote(''); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.modalCancelText, { color: colors.text }]}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, { backgroundColor: Colors.success }]}
                                onPress={handleReturn}
                                disabled={saving}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalConfirmText}>{saving ? 'İşleniyor...' : 'İade Onayla'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, flex: 1, textAlign: 'center' },
    heroCard: {
        alignItems: 'center',
        padding: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    heroIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    heroName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    heroCategory: { fontSize: 13, marginTop: 4 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.md,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusPillText: { fontSize: 13, fontWeight: '700' },
    detailCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        ...Shadows.small,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    detailLabel: { fontSize: 13, fontWeight: '600' },
    detailValue: { fontSize: 13, fontWeight: '500' },
    assignmentCard: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    assignmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
    assignmentTitle: { fontSize: 13, fontWeight: '700' },
    assignmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.lg
    },
    assignmentName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    assignmentDate: { fontSize: 13 },
    assignmentNote: { fontSize: 13, marginTop: 6, fontStyle: 'italic', lineHeight: 18 },
    returnMiniBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.success,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10
    },
    returnMiniText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadows.medium,
    },
    actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: Spacing.md, letterSpacing: -0.3 },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    historyDot: { width: 10, height: 10, borderRadius: 5 },
    historyName: { fontSize: 14, fontWeight: '600' },
    historyDates: { fontSize: 12, marginTop: 2 },
    historyNote: { fontSize: 11, marginTop: 2, fontStyle: 'italic' },
    historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
    historyBadgeText: { fontSize: 11, fontWeight: '700' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: 40,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#CBD5E1',
        alignSelf: 'center', marginBottom: Spacing.lg,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: Spacing.md, letterSpacing: -0.3 },
    modalSubtitle: { fontSize: 14, marginBottom: Spacing.md },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    memberAvatar: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
    memberAvatarText: { fontSize: 15, fontWeight: '800' },
    memberName: { fontSize: 14, fontWeight: '600' },
    memberRole: { fontSize: 12 },
    modalInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        fontSize: 14,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    modalBtns: { flexDirection: 'row', gap: Spacing.md },
    modalCancelBtn: {
        flex: 1, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg, borderWidth: 1,
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '600' },
    modalConfirmBtn: {
        flex: 2, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
