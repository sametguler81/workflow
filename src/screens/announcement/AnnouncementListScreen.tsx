import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Modal,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../../components/Avatar';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import {
    getCompanyAnnouncements,
    markAsRead,
    dismissAnnouncement,
    Announcement,
} from '../../services/announcementService';

interface AnnouncementListScreenProps {
    onBack: () => void;
    onNavigateCreate: () => void;
}

export function AnnouncementListScreen({ onBack, onNavigateCreate }: AnnouncementListScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const canCreate = profile?.role === 'admin' || profile?.role === 'idari' || profile?.role === 'muhasebe';

    const loadData = useCallback(async () => {
        if (!profile) return;
        try {
            const data = await getCompanyAnnouncements(profile.companyId, profile.uid, profile.role);
            console.log('Fetched announcements:', data.length); // Debug
            setAnnouncements(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleOpen = async (item: Announcement) => {
        setSelectedAnnouncement(item);
        if (profile && !item.readBy?.includes(profile.uid)) {
            try {
                await markAsRead(item.id, profile.uid);
                // Update local state
                setAnnouncements((prev) =>
                    prev.map((a) =>
                        a.id === item.id ? { ...a, readBy: [...(a.readBy || []), profile.uid] } : a
                    )
                );
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDismiss = (item: Announcement) => {
        Alert.alert('Kaldır', 'Bu duyuruyu listenizden kaldırmak istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Kaldır',
                onPress: async () => {
                    if (!profile) return;
                    try {
                        await dismissAnnouncement(item.id, profile.uid);
                        setSelectedAnnouncement(null);
                        setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
                    } catch (err) {
                        Alert.alert('Hata', 'Duyuru kaldırılamadı.');
                    }
                },
            },
        ]);
    };

    const isUnread = (item: Announcement) => !item.readBy?.includes(profile?.uid || '');

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return d.toLocaleDateString('tr-TR');
    };

    const renderItem = ({ item }: { item: Announcement }) => {
        const unread = isUnread(item);
        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.card,
                        borderColor: unread ? Colors.primary + '40' : colors.borderLight,
                        borderLeftWidth: unread ? 4 : 1,
                        borderLeftColor: unread ? Colors.primary : colors.borderLight,
                    },
                ]}
                onPress={() => handleOpen(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Avatar name={item.createdByName || 'D'} size={36} color={Colors.primary} />
                        <View style={styles.cardHeaderInfo}>
                            <Text
                                style={[
                                    styles.cardAuthor,
                                    { color: colors.text, fontWeight: unread ? '800' : '600' },
                                ]}
                            >
                                {item.createdByName}
                            </Text>
                            <Text style={[styles.cardTime, { color: colors.textTertiary }]}>
                                {formatDate(item.createdAt)}
                            </Text>
                        </View>
                    </View>
                    {unread && <View style={styles.unreadDot} />}
                </View>
                <Text
                    style={[
                        styles.cardTitle,
                        { color: colors.text, fontWeight: unread ? '700' : '600' },
                    ]}
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
                <Text style={[styles.cardPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.message}
                </Text>
                <View style={styles.cardFooter}>
                    <View style={[styles.targetBadge, {
                        backgroundColor: item.targetRole ? Colors.warning + '20' : (item.targetType === 'all' ? Colors.success + '20' : Colors.secondary + '20')
                    }]}>
                        <Ionicons
                            name={item.targetRole ? 'shield-checkmark' : (item.targetType === 'all' ? 'people' : 'person')}
                            size={12}
                            color={item.targetRole ? Colors.warning : (item.targetType === 'all' ? Colors.success : Colors.secondary)}
                        />
                        <Text style={{ fontSize: 11, color: item.targetRole ? Colors.warning : (item.targetType === 'all' ? Colors.success : Colors.secondary), fontWeight: '600' }}>
                            {item.targetRole ? (item.targetRole === 'idari' ? 'İdari Ekip' : item.targetRole === 'muhasebe' ? 'Muhasebe' : item.targetRole.toUpperCase()) : (item.targetType === 'all' ? 'Herkese' : 'Seçili Kişiler')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#667eea', '#764ba2'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Duyurular</Text>
                    {canCreate ? (
                        <TouchableOpacity onPress={onNavigateCreate} style={styles.headerBtn}>
                            <Ionicons name="add-circle" size={28} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
                <Text style={styles.headerSub}>
                    {announcements.filter(isUnread).length > 0
                        ? `${announcements.filter(isUnread).length} okunmamış duyuru`
                        : 'Tüm duyurular okundu ✓'}
                </Text>
            </LinearGradient>

            {/* List */}
            <FlatList
                data={announcements}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Ionicons name="megaphone-outline" size={48} color={colors.textTertiary} />
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                Henüz duyuru yok
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Detail Modal */}
            <Modal visible={!!selectedAnnouncement} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHandle} />

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            {selectedAnnouncement && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <Avatar name={selectedAnnouncement.createdByName || 'D'} size={44} color={Colors.primary} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.modalAuthor, { color: colors.text }]}>
                                                {selectedAnnouncement.createdByName}
                                            </Text>
                                            <Text style={[styles.modalDate, { color: colors.textTertiary }]}>
                                                {new Date(selectedAnnouncement.createdAt).toLocaleDateString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        {selectedAnnouncement.title}
                                    </Text>

                                    <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                                        {selectedAnnouncement.message}
                                    </Text>

                                    <View style={[styles.modalMeta, { borderTopColor: colors.borderLight }]}>
                                        <View style={[styles.targetBadge, { backgroundColor: selectedAnnouncement.targetType === 'all' ? Colors.success + '20' : Colors.secondary + '20' }]}>
                                            <Ionicons
                                                name={selectedAnnouncement.targetType === 'all' ? 'people' : 'person'}
                                                size={14}
                                                color={selectedAnnouncement.targetType === 'all' ? Colors.success : Colors.secondary}
                                            />
                                            <Text style={{ fontSize: 12, color: selectedAnnouncement.targetType === 'all' ? Colors.success : Colors.secondary, fontWeight: '600' }}>
                                                {selectedAnnouncement.targetRole
                                                    ? `Hedef: ${selectedAnnouncement.targetRole.toUpperCase()}`
                                                    : (selectedAnnouncement.targetType === 'all' ? 'Herkese Gönderildi' : 'Seçili Kişilere Gönderildi')}
                                            </Text>
                                        </View>
                                        <Text style={[styles.modalReadCount, { color: colors.textTertiary }]}>
                                            <Ionicons name="eye-outline" size={13} color={colors.textTertiary} />
                                            {' '}{selectedAnnouncement.readBy?.length || 0} kişi okudu
                                        </Text>
                                    </View>

                                    {/* Delete button for creator/admin */}
                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => handleDismiss(selectedAnnouncement)}
                                    >
                                        <Ionicons name="eye-off-outline" size={18} color={Colors.danger} />
                                        <Text style={[styles.deleteBtnText]}> Listeden Kaldır</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.modalClose, { backgroundColor: colors.background }]}
                            onPress={() => setSelectedAnnouncement(null)}
                        >
                            <Text style={[styles.modalCloseText, { color: colors.text }]}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 24,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 8, textAlign: 'center', fontWeight: '500' },
    list: { padding: Spacing.lg, paddingBottom: 40 },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        ...Shadows.small,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    cardHeaderInfo: { marginLeft: 10 },
    cardAuthor: { fontSize: 14 },
    cardTime: { fontSize: 11, marginTop: 1 },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    cardTitle: { fontSize: 16, marginBottom: 4 },
    cardPreview: { fontSize: 13, lineHeight: 19 },
    cardFooter: { flexDirection: 'row', marginTop: Spacing.sm, alignItems: 'center' },
    targetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
    emptyText: { fontSize: 14, fontWeight: '500' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingTop: Spacing.md,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ccc',
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    modalScroll: { paddingHorizontal: Spacing.xl },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalAuthor: { fontSize: 16, fontWeight: '700' },
    modalDate: { fontSize: 12, marginTop: 2 },
    modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.md },
    modalMessage: { fontSize: 15, lineHeight: 24, marginBottom: Spacing.xl },
    modalMeta: {
        borderTopWidth: 1,
        paddingTop: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalReadCount: { fontSize: 12 },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xl,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.danger + '30',
        backgroundColor: Colors.danger + '10',
    },
    deleteBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
    modalClose: {
        padding: Spacing.lg,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: Spacing.md,
    },
    modalCloseText: { fontSize: 16, fontWeight: '700' },
});
