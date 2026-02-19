import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getCompanyDetailById,
    updateCompanyPlan,
    updateCompanyDetails,
    deleteCompany,
    addUserToCompany,
    PLAN_DETAILS,
} from '../../services/superAdminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Avatar } from '../../components/Avatar';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';

interface AdminCompanyDetailScreenProps {
    companyId: string;
    onBack: () => void;
}

const roleLabels: Record<string, string> = {
    admin: 'Yönetici',
    personel: 'Personel',
    idari: 'İdari',
    muhasebe: 'Muhasebe',
    superadmin: 'Super Admin',
};

export function AdminCompanyDetailScreen({ companyId, onBack }: AdminCompanyDetailScreenProps) {
    const { colors } = useTheme();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'personel' | 'idari' | 'muhasebe' | 'admin'>('personel');
    const [registering, setRegistering] = useState(false);

    // Edit Company Name State
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    const fetchCompany = useCallback(async () => {
        try {
            const data = await getCompanyDetailById(companyId);
            setCompany(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [companyId]);

    useEffect(() => { fetchCompany(); }, [fetchCompany]);

    const onRefresh = () => { setRefreshing(true); fetchCompany(); };

    const handlePlanChange = async (plan: 'free' | 'pro' | 'enterprise') => {
        try {
            const details = PLAN_DETAILS[plan];
            await updateCompanyPlan(companyId, plan, details.userLimit);
            Alert.alert('Başarılı ✅', `Plan "${details.name}" olarak güncellendi.`);
            setShowPlanModal(false);
            fetchCompany();
        } catch (err) {
            Alert.alert('Hata', 'Plan güncellenemedi.');
        }
    };

    const handleUpdateName = async () => {
        if (!editNameValue.trim()) return;
        try {
            await updateCompanyDetails(companyId, { name: editNameValue.trim() });
            Alert.alert('Başarılı', 'Firma adı güncellendi.');
            setIsEditingName(false);
            fetchCompany();
        } catch (err) {
            Alert.alert('Hata', 'İsim güncellenemedi.');
        }
    };

    const handleDeleteCompany = () => {
        Alert.alert(
            'Firmayı Sil',
            `"${company.name}" firmasını ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCompany(companyId);
                            Alert.alert('Başarılı', 'Firma silindi.');
                            onBack();
                        } catch (err) {
                            Alert.alert('Hata', 'Firma silinemedi.');
                        }
                    }
                }
            ]
        );
    };

    const handleAddUser = async () => {
        if (!newEmail || !newName || !newPassword) {
            Alert.alert('Uyarı', 'Tüm alanları doldurun.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Uyarı', 'Şifre en az 6 karakter olmalı.');
            return;
        }
        setRegistering(true);
        try {
            await addUserToCompany(
                newEmail,
                newPassword,
                newName,
                newRole,
                companyId,
                company?.name || ''
            );
            Alert.alert('Başarılı ✅', `${newName} firmaya eklendi.`);
            setShowAddUser(false);
            setNewEmail('');
            setNewName('');
            setNewPassword('');
            fetchCompany();
        } catch (err: any) {
            const msg = err.code === 'auth/email-already-in-use'
                ? 'Bu e-posta adresi zaten kullanılıyor.'
                : 'Kullanıcı eklenemedi: ' + err.message;
            Alert.alert('Hata', msg);
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <LoadingSpinner message="Firma yükleniyor..." />;
    if (!company) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textTertiary }}>Firma bulunamadı.</Text>
            </View>
        );
    }

    const plan = PLAN_DETAILS[company.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
    const stats = company.stats || {};

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#0F172A', '#1E293B'] as any}
                    style={styles.header}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Firma Detayı</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.companyInfoCard}>
                        <View style={[styles.companyAvatar, { backgroundColor: plan.color + '25' }]}>
                            <Ionicons name="business" size={28} color={plan.color} />
                        </View>

                        {isEditingName ? (
                            <View style={styles.editNameRow}>
                                <InputField
                                    value={editNameValue}
                                    onChangeText={setEditNameValue}
                                    placeholder="Firma Adı"
                                    autoFocus
                                    containerStyle={{ marginBottom: 0, width: 200 }}
                                />
                                <TouchableOpacity onPress={handleUpdateName} style={[styles.iconBtn, { backgroundColor: Colors.success }]}>
                                    <Ionicons name="checkmark" size={20} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsEditingName(false)} style={[styles.iconBtn, { backgroundColor: Colors.danger }]}>
                                    <Ionicons name="close" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.nameRow}>
                                <Text style={styles.companyName}>{company.name}</Text>
                                <TouchableOpacity onPress={() => { setEditNameValue(company.name); setIsEditingName(true); }}>
                                    <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.5)" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.planBadge, { backgroundColor: plan.color + '25' }]}>
                            <Text style={[styles.planBadgeText, { color: plan.color }]}>{plan.name}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Stats */}
                    <View style={styles.statsGrid}>
                        {[
                            { icon: 'people-outline', label: 'Üye', value: stats.memberCount || 0, color: '#3B82F6' },
                            { icon: 'calendar-outline', label: 'İzin', value: stats.leaveCount || 0, color: '#059669' },
                            { icon: 'receipt-outline', label: 'Masraf', value: stats.expenseCount || 0, color: '#D97706' },
                            { icon: 'document-text-outline', label: 'Belge', value: stats.invoiceCount || 0, color: '#8B5CF6' },
                        ].map(s => (
                            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                                <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                                </View>
                                <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Plan Management */}
                    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Abonelik Planı</Text>
                            <TouchableOpacity onPress={() => setShowPlanModal(!showPlanModal)}>
                                <Ionicons name={showPlanModal ? 'close' : 'create-outline'} size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.planInfo}>
                            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                            <Text style={[styles.planPrice, { color: colors.text }]}>
                                {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price}/ay`}
                            </Text>
                            <Text style={[styles.planLimit, { color: colors.textTertiary }]}>
                                {plan.userLimit} kullanıcıya kadar
                            </Text>
                        </View>

                        {showPlanModal && (
                            <View style={styles.planOptions}>
                                {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map(key => {
                                    const p = PLAN_DETAILS[key];
                                    const isActive = company.plan === key;
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.planOption, {
                                                borderColor: isActive ? p.color : colors.borderLight,
                                                backgroundColor: isActive ? p.color + '10' : colors.surfaceVariant,
                                            }]}
                                            onPress={() => handlePlanChange(key)}
                                        >
                                            <Text style={[styles.planOptionName, { color: isActive ? p.color : colors.text }]}>
                                                {p.name}
                                            </Text>
                                            <Text style={[styles.planOptionPrice, { color: colors.textSecondary }]}>
                                                {p.price === 0 ? 'Ücretsiz' : `₺${p.price}/ay`}
                                            </Text>
                                            {isActive && <Ionicons name="checkmark-circle" size={18} color={p.color} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Members */}
                    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                Üyeler ({company.members?.length || 0})
                            </Text>
                            <TouchableOpacity onPress={() => setShowAddUser(!showAddUser)}>
                                <Ionicons name={showAddUser ? 'close' : 'person-add-outline'} size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {showAddUser && (
                            <View style={[styles.addUserForm, { borderColor: colors.borderLight }]}>
                                <InputField label="Ad Soyad" icon="person-outline" placeholder="Ahmet Yılmaz" value={newName} onChangeText={setNewName} />
                                <InputField label="E-posta" icon="mail-outline" placeholder="ornek@firma.com" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
                                <InputField label="Şifre" icon="lock-closed-outline" placeholder="En az 6 karakter" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                                <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>Rol</Text>
                                <View style={styles.roleRow}>
                                    {(['personel', 'idari', 'muhasebe', 'admin'] as const).map(r => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.roleChip, { backgroundColor: newRole === r ? Colors.primary : colors.surfaceVariant }]}
                                            onPress={() => setNewRole(r)}
                                        >
                                            <Text style={{ color: newRole === r ? '#FFF' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                                                {roleLabels[r]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <PremiumButton title="Ekle" onPress={handleAddUser} loading={registering} icon={<Ionicons name="checkmark-circle" size={16} color="#FFF" />} style={{ marginTop: Spacing.sm }} />
                            </View>
                        )}

                        {company.members?.map((member: any) => (
                            <View key={member.uid} style={[styles.memberRow, { borderBottomColor: colors.borderLight }]}>
                                <Avatar name={member.displayName || 'U'} size={38} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.memberName, { color: colors.text }]}>{member.displayName}</Text>
                                    <Text style={[styles.memberEmail, { color: colors.textTertiary }]}>{member.email}</Text>
                                </View>
                                <View style={[styles.roleBadge, { backgroundColor: Colors.primary + '15' }]}>
                                    <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '700' }}>
                                        {roleLabels[member.role] || member.role}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Financial Summary */}
                    {stats.totalExpenseAmount > 0 && (
                        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Finansal Özet</Text>
                            <View style={styles.financialRow}>
                                <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>Toplam Masraf</Text>
                                <Text style={[{ color: colors.text, fontSize: 16, fontWeight: '800' }]}>
                                    ₺{stats.totalExpenseAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.deleteCompanyBtn, { backgroundColor: Colors.danger + '15', borderColor: Colors.danger }]}
                        onPress={handleDeleteCompany}
                    >
                        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                        <Text style={[styles.deleteCompanyText, { color: Colors.danger }]}>Firmayı Sil</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 24,
        paddingHorizontal: Spacing.xl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    companyInfoCard: { alignItems: 'center' },
    companyAvatar: {
        width: 64, height: 64, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    editNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    companyName: { fontSize: 22, fontWeight: '800', color: '#FFF' },
    planBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
    planBadgeText: { fontSize: 13, fontWeight: '700' },
    content: { padding: Spacing.xl, paddingBottom: 100 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.xl },
    statCard: {
        width: '48%' as any, padding: Spacing.md,
        borderRadius: BorderRadius.lg, borderWidth: 1, ...Shadows.small,
    },
    statIcon: {
        width: 32, height: 32, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    },
    statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '500' },
    section: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.small,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    planInfo: { marginBottom: Spacing.md },
    planName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    planPrice: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    planLimit: { fontSize: 12 },
    planOptions: { gap: 8 },
    planOption: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 12, borderWidth: 1.5, gap: 10,
    },
    planOptionName: { flex: 1, fontSize: 14, fontWeight: '700' },
    planOptionPrice: { fontSize: 13 },
    addUserForm: { borderTopWidth: 1, paddingTop: Spacing.md, marginBottom: Spacing.md },
    roleLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, marginTop: -Spacing.sm },
    roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    roleChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    memberRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1,
    },
    memberName: { fontSize: 14, fontWeight: '600' },
    memberEmail: { fontSize: 11, marginTop: 1 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    financialRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    deleteCompanyBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 20,
    },
    deleteCompanyText: { fontSize: 16, fontWeight: '700' },
});
