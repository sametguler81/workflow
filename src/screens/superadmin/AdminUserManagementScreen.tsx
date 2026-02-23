import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getUsers, getAllCompanies, updateUserRoleAdmin, deleteUser, updateUserDetails } from '../../services/superAdminService';
import { resetPassword } from '../../services/authService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Avatar } from '../../components/Avatar';

interface AdminUserManagementScreenProps {
    onBack: () => void;
}

type RoleFilter = 'all' | 'personel' | 'idari' | 'muhasebe' | 'admin';

const roleLabels: Record<string, string> = {
    admin: 'Yönetici',
    personel: 'Personel',
    idari: 'İdari',
    muhasebe: 'Muhasebe',
    superadmin: 'Super Admin',
};

const roleColors: Record<string, string> = {
    admin: '#DC2626',
    personel: '#3B82F6',
    idari: '#059669',
    muhasebe: '#D97706',
    superadmin: '#0F172A',
};

export function AdminUserManagementScreen({ onBack }: AdminUserManagementScreenProps) {
    const { colors } = useTheme();
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all'); // 'all' or companyId

    // Pagination State
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Edit User State
    const [editUserModal, setEditUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newDisplayName, setNewDisplayName] = useState('');

    // Filter State
    const [filterModal, setFilterModal] = useState(false);
    const [tempRoleFilter, setTempRoleFilter] = useState<RoleFilter>('all');
    const [tempCompanyFilter, setTempCompanyFilter] = useState<string>('all');

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersDataResponse, companiesData] = await Promise.all([
                getUsers({ limit: 10 }), // Initial load: 10 users
                getAllCompanies()
            ]);
            setUsers(usersDataResponse.users);
            setFiltered(usersDataResponse.users);
            setLastDoc(usersDataResponse.lastDoc);
            setHasMore(usersDataResponse.users.length === 10);
            setCompanies(companiesData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchFilteredUsers = async (role: string, companyId: string) => {
        try {
            setLoading(true);
            const data = await getUsers({
                role: role !== 'all' ? role : undefined,
                companyId: companyId !== 'all' ? companyId : undefined,
                limit: 10
            });
            setUsers(data.users);
            setFiltered(data.users);
            setLastDoc(data.lastDoc);
            setHasMore(data.users.length === 10);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    // Handle Search (Client-side filtering for now, but if search is active, we might need broader data provided by fetchFilteredUsers context or a specific search fetch)
    // For this optimized version, if user acts on search, we need to decide.
    // Let's keep it simple: Search searches within the *loaded* users.
    // If user wants to search GLOBAL, they might expect it.
    // Improving: If search length > 2, fetch ALL users (or limit 50) to search.
    useEffect(() => {
        if (search.trim().length > 2) {
            const doSearch = async () => {
                const searchResponse = await getUsers({ limit: 50 }); // Fetch more for search
                const allUsers = searchResponse.users;
                const q = search.toLowerCase();
                const result = allUsers.filter((u: any) =>
                    u.displayName?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q) ||
                    u.companyName?.toLowerCase().includes(q)
                );
                setFiltered(result);
            }
            doSearch();
        } else if (search.trim().length === 0) {
            let result = [...users];
            if (roleFilter !== 'all') {
                result = result.filter(u => u.role === roleFilter);
            }
            if (companyFilter !== 'all') {
                result = result.filter(u => u.companyId === companyFilter);
            }
            setFiltered(result);
        }
    }, [search, users, roleFilter, companyFilter]);

    const loadMore = async () => {
        if (!hasMore || loadingMore || loading || refreshing || search.trim().length > 2) return;

        try {
            setLoadingMore(true);
            const data = await getUsers({
                role: roleFilter !== 'all' ? roleFilter : undefined,
                companyId: companyFilter !== 'all' ? companyFilter : undefined,
                limit: 10,
                startAfterDoc: lastDoc
            });

            if (data.users.length > 0) {
                setUsers(prev => [...prev, ...data.users]);
                setFiltered(prev => [...prev, ...data.users]);
                setLastDoc(data.lastDoc);
            }

            if (data.users.length < 10) {
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    const onRefresh = () => { setRefreshing(true); fetchInitialData(); };

    const openFilterModal = () => {
        setTempRoleFilter(roleFilter);
        setTempCompanyFilter(companyFilter);
        setFilterModal(true);
    };

    const applyFilters = () => {
        setRoleFilter(tempRoleFilter);
        setCompanyFilter(tempCompanyFilter);
        setFilterModal(false);
        fetchFilteredUsers(tempRoleFilter, tempCompanyFilter);
    };

    const clearFilters = () => {
        setTempRoleFilter('all');
        setTempCompanyFilter('all');
        setRoleFilter('all');
        setCompanyFilter('all');
        setFilterModal(false);
        fetchInitialData(); // Reset to initial 5
    };

    const handleRoleChange = (uid: string, currentRole: string) => {
        if (currentRole === 'superadmin') return;
        const roles: Array<'personel' | 'idari' | 'muhasebe' | 'admin'> = ['personel', 'idari', 'muhasebe', 'admin'];
        Alert.alert(
            'Rol Değiştir',
            'Yeni rolü seçin:',
            [
                ...roles.map(r => ({
                    text: roleLabels[r] + (r === currentRole ? ' ✓' : ''),
                    onPress: async () => {
                        if (r === currentRole) return;
                        try {
                            await updateUserRoleAdmin(uid, r);
                            Alert.alert('Başarılı', 'Rol güncellendi.');
                            fetchInitialData();
                        } catch (err) {
                            Alert.alert('Hata', 'Rol güncellenemedi.');
                        }
                    },
                })),
                { text: 'İptal', style: 'cancel' },
            ]
        );
    };

    const handleDelete = (uid: string, name: string) => {
        Alert.alert(
            'Kullanıcı Sil',
            `"${name}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteUser(uid);
                            Alert.alert('Başarılı', 'Kullanıcı silindi.');
                            fetchInitialData();
                        } catch (err) {
                            Alert.alert('Hata', 'Kullanıcı silinemedi.');
                        }
                    },
                },
            ]
        );
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setNewDisplayName(user.displayName || '');
        setEditUserModal(true);
    };

    const saveUserUpdate = async () => {
        if (!editingUser || !newDisplayName.trim()) return;
        try {
            await updateUserDetails(editingUser.uid, { displayName: newDisplayName.trim() });
            Alert.alert('Başarılı', 'Kullanıcı bilgileri güncellendi.');
            setEditUserModal(false);
            fetchInitialData();
        } catch (err) {
            Alert.alert('Hata', 'Güncelleme başarısız.');
        }
    };

    const handleResetPassword = (email: string) => {
        Alert.alert(
            'Şifre Sıfırla',
            `${email} adresine şifre sıfırlama bağlantısı gönderilsin mi?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Gönder',
                    onPress: async () => {
                        try {
                            await resetPassword(email);
                            Alert.alert('Başarılı', 'Sıfırlama bağlantısı gönderildi.');
                        } catch (err) {
                            Alert.alert('Hata', 'İşlem başarısız.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <LoadingSpinner message="Kullanıcılar yükleniyor..." />;

    const renderUser = ({ item }: { item: any }) => {
        const color = roleColors[item.role] || '#64748B';
        return (
            <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <View style={styles.userHeader}>
                    <Avatar name={item.displayName || 'U'} size={42} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.displayName || '—'}</Text>
                        <Text style={[styles.userEmail, { color: colors.textTertiary }]}>{item.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: color + '15' }]}>
                        <Text style={[styles.roleBadgeText, { color }]}>{roleLabels[item.role] || item.role}</Text>
                    </View>
                </View>

                <View style={styles.userMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="business-outline" size={13} color={colors.textTertiary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                            {item.companyName || '—'}
                        </Text>
                    </View>
                    <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : '—'}
                    </Text>
                </View>

                {/* New Action Bar - All actions in one row */}
                {item.role !== 'superadmin' && (
                    <View style={styles.actionBar}>
                        <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => handleEditUser(item)}
                        >
                            <Ionicons name="pencil" size={18} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => handleResetPassword(item.email)}
                        >
                            <Ionicons name="key-outline" size={18} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => handleRoleChange(item.uid, item.role)}
                        >
                            <Ionicons name="swap-horizontal-outline" size={18} color={Colors.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionIconBtn, { borderRightWidth: 0 }]}
                            onPress={() => handleDelete(item.uid, item.displayName)}
                        >
                            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                        </TouchableOpacity>
                    </View>
                )}
            </View >
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient colors={['#0F172A', '#1E293B'] as any} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kullanıcılar</Text>
                    <Text style={styles.headerCount}>{users.length} kullanıcı</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.searchWrap, { flex: 1, marginBottom: 0 }]}>
                        <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Kullanıcı ara..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.filterBtn,
                            (roleFilter !== 'all' || companyFilter !== 'all') && { backgroundColor: Colors.primary }
                        ]}
                        onPress={openFilterModal}
                    >
                        <Ionicons name="filter" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.uid}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ padding: 20 }}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                            {search ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}
                        </Text>
                    </View>
                }
            />

            {/* Filter Modal */}
            {filterModal && (
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Filtrele</Text>
                            <TouchableOpacity onPress={() => setFilterModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Role Filter */}
                            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>Rol</Text>
                            <View style={styles.filterOptionsGrid}>
                                {(['all', 'personel', 'idari', 'muhasebe', 'admin'] as RoleFilter[]).map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[
                                            styles.filterOptionChip,
                                            tempRoleFilter === f && { backgroundColor: Colors.primary + '20', borderColor: Colors.primary }
                                        ]}
                                        onPress={() => setTempRoleFilter(f)}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            { color: colors.textSecondary },
                                            tempRoleFilter === f && { color: Colors.primary, fontWeight: '700' }
                                        ]}>
                                            {f === 'all' ? 'Tümü' : roleLabels[f]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Company Filter */}
                            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>Firma</Text>
                            <View style={styles.companyList}>
                                <TouchableOpacity
                                    style={[
                                        styles.companyOption,
                                        tempCompanyFilter === 'all' && { backgroundColor: Colors.primary + '10' }
                                    ]}
                                    onPress={() => setTempCompanyFilter('all')}
                                >
                                    <Ionicons
                                        name={tempCompanyFilter === 'all' ? "radio-button-on" : "radio-button-off"}
                                        size={20}
                                        color={tempCompanyFilter === 'all' ? Colors.primary : colors.textTertiary}
                                    />
                                    <Text style={[styles.companyOptionText, { color: colors.text }]}>Tüm Firmalar</Text>
                                </TouchableOpacity>

                                {companies.map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.companyOption,
                                            tempCompanyFilter === c.id && { backgroundColor: Colors.primary + '10' }
                                        ]}
                                        onPress={() => setTempCompanyFilter(c.id)}
                                    >
                                        <Ionicons
                                            name={tempCompanyFilter === c.id ? "radio-button-on" : "radio-button-off"}
                                            size={20}
                                            color={tempCompanyFilter === c.id ? Colors.primary : colors.textTertiary}
                                        />
                                        <Text style={[styles.companyOptionText, { color: colors.text }]}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
                            <TouchableOpacity
                                style={[styles.modalFooterBtn, { backgroundColor: colors.surfaceVariant }]}
                                onPress={clearFilters}
                            >
                                <Text style={{ color: colors.text }}>Temizle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalFooterBtn, { backgroundColor: Colors.primary }]}
                                onPress={applyFilters}
                            >
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Uygula</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Edit User Modal (Simple Overlay) */}
            {editUserModal && (
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Kullanıcı Düzenle</Text>
                        <TextInput
                            value={newDisplayName}
                            onChangeText={setNewDisplayName}
                            style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                            placeholder="Ad Soyad"
                            placeholderTextColor={colors.textTertiary}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setEditUserModal(false)} style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]}>
                                <Text style={{ color: colors.text }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveUserUpdate} style={[styles.modalBtn, { backgroundColor: Colors.primary }]}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 55, paddingBottom: 20, paddingHorizontal: Spacing.xl },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFF' },
    headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#FFF', padding: 0 },
    filterBtn: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    list: { padding: Spacing.xl, paddingBottom: 100 },
    userCard: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.lg, marginBottom: 10, ...Shadows.small,
    },
    userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    userName: { fontSize: 15, fontWeight: '700', marginBottom: 1 },
    userEmail: { fontSize: 12 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    roleBadgeText: { fontSize: 11, fontWeight: '700' },
    userMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '500' },
    actionBar: {
        flexDirection: 'row', borderTopWidth: 1, borderColor: '#334155', marginTop: 12,
    },
    actionIconBtn: {
        flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        paddingVertical: 12, borderRightWidth: 1, borderColor: '#334155',
    },
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center', zIndex: 100,
    },
    modalCard: {
        width: '90%', padding: 20, borderRadius: 20, ...Shadows.medium,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    modalInput: {
        borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { marginTop: 12, fontSize: 14, fontWeight: '500' },

    // Filter Modal Styles
    filterSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
    filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterOptionChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(150,150,150,0.1)',
    },
    filterOptionText: { fontSize: 13, fontWeight: '500' },
    companyList: { maxHeight: 200, marginTop: 5 },
    companyOption: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8,
    },
    companyOptionText: { fontSize: 14, flex: 1 },
    modalFooter: {
        flexDirection: 'row', justifyContent: 'space-between', gap: 12,
        marginTop: 20, paddingTop: 16, borderTopWidth: 1,
    },
    modalFooterBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
});
