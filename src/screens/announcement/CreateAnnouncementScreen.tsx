import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../../components/Avatar';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { createAnnouncement } from '../../services/announcementService';
import { getCompanyMembers } from '../../services/companyService';

interface CreateAnnouncementScreenProps {
    onBack: () => void;
}

interface MemberItem {
    uid: string;
    displayName: string;
    email: string;
    selected: boolean;
}

export function CreateAnnouncementScreen({ onBack }: CreateAnnouncementScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAll, setTargetAll] = useState(true);
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!targetAll) {
            loadMembers();
        }
    }, [targetAll]);

    const loadMembers = async () => {
        if (!profile || members.length > 0) return;
        setLoadingMembers(true);
        try {
            const data = await getCompanyMembers(profile.companyId);
            setMembers(
                data
                    .filter((m: any) => m.uid !== profile.uid) // Don't show self
                    .map((m: any) => ({
                        uid: m.uid,
                        displayName: m.displayName || m.email,
                        email: m.email,
                        selected: false,
                    }))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMembers(false);
        }
    };

    const toggleMember = (uid: string) => {
        setMembers((prev) =>
            prev.map((m) => (m.uid === uid ? { ...m, selected: !m.selected } : m))
        );
    };

    const selectAll = () => {
        const allSelected = members.every((m) => m.selected);
        setMembers((prev) => prev.map((m) => ({ ...m, selected: !allSelected })));
    };

    const handleSend = async () => {
        if (!profile) return;
        if (!title.trim()) {
            Alert.alert('Uyarı', 'Lütfen duyuru başlığı girin.');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Uyarı', 'Lütfen duyuru mesajı girin.');
            return;
        }
        if (!targetAll && members.filter((m) => m.selected).length === 0) {
            Alert.alert('Uyarı', 'Lütfen en az bir kişi seçin.');
            return;
        }

        setSending(true);
        try {
            const selectedIds = targetAll ? [] : members.filter((m) => m.selected).map((m) => m.uid);
            await createAnnouncement({
                companyId: profile.companyId,
                title: title.trim(),
                message: message.trim(),
                createdBy: profile.uid,
                createdByName: profile.displayName || profile.email,
                targetType: targetAll ? 'all' : 'selected',
                targetUserIds: selectedIds,
            });
            Alert.alert('Başarılı', 'Duyuru başarıyla gönderildi! 🎉', [
                { text: 'Tamam', onPress: onBack },
            ]);
        } catch (err) {
            console.error(err);
            Alert.alert('Hata', 'Duyuru gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    const selectedCount = members.filter((m) => m.selected).length;

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
                    <Text style={styles.headerTitle}>Yeni Duyuru</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={[styles.label, { color: colors.text }]}>Başlık</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Duyuru başlığı..."
                    placeholderTextColor={colors.textTertiary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                />

                {/* Message */}
                <Text style={[styles.label, { color: colors.text }]}>Mesaj</Text>
                <TextInput
                    style={[styles.input, styles.messageInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Duyuru mesajını yazın..."
                    placeholderTextColor={colors.textTertiary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    textAlignVertical="top"
                />

                {/* Target Selection */}
                <View style={[styles.targetSection, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={styles.targetHeader}>
                        <Ionicons name="people" size={20} color={Colors.primary} />
                        <Text style={[styles.targetTitle, { color: colors.text }]}>Hedef Kitle</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.targetOption,
                            {
                                backgroundColor: targetAll ? Colors.primary + '15' : 'transparent',
                                borderColor: targetAll ? Colors.primary + '40' : colors.borderLight,
                            },
                        ]}
                        onPress={() => setTargetAll(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.targetOptionLeft}>
                            <View
                                style={[
                                    styles.radio,
                                    {
                                        borderColor: targetAll ? Colors.primary : colors.textTertiary,
                                        backgroundColor: targetAll ? Colors.primary : 'transparent',
                                    },
                                ]}
                            >
                                {targetAll && <View style={styles.radioInner} />}
                            </View>
                            <View>
                                <Text style={[styles.targetOptionTitle, { color: colors.text }]}>
                                    Tüm Çalışanlar
                                </Text>
                                <Text style={[styles.targetOptionSub, { color: colors.textTertiary }]}>
                                    Firmadaki tüm personele gönderilir
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="people" size={22} color={targetAll ? Colors.primary : colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.targetOption,
                            {
                                backgroundColor: !targetAll ? Colors.secondary + '15' : 'transparent',
                                borderColor: !targetAll ? Colors.secondary + '40' : colors.borderLight,
                            },
                        ]}
                        onPress={() => setTargetAll(false)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.targetOptionLeft}>
                            <View
                                style={[
                                    styles.radio,
                                    {
                                        borderColor: !targetAll ? Colors.secondary : colors.textTertiary,
                                        backgroundColor: !targetAll ? Colors.secondary : 'transparent',
                                    },
                                ]}
                            >
                                {!targetAll && <View style={styles.radioInner} />}
                            </View>
                            <View>
                                <Text style={[styles.targetOptionTitle, { color: colors.text }]}>
                                    Seçili Kişiler
                                </Text>
                                <Text style={[styles.targetOptionSub, { color: colors.textTertiary }]}>
                                    Sadece seçtiğiniz kişilere gönderilir
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="person" size={22} color={!targetAll ? Colors.secondary : colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Member Selection */}
                {!targetAll && (
                    <View style={[styles.membersSection, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <View style={styles.membersHeader}>
                            <Text style={[styles.membersTitle, { color: colors.text }]}>
                                Kişi Seçimi {selectedCount > 0 ? `(${selectedCount} seçili)` : ''}
                            </Text>
                            <TouchableOpacity onPress={selectAll}>
                                <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>
                                    {members.every((m) => m.selected) ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {loadingMembers ? (
                            <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />
                        ) : (
                            members.map((member) => (
                                <TouchableOpacity
                                    key={member.uid}
                                    style={[
                                        styles.memberItem,
                                        {
                                            backgroundColor: member.selected ? Colors.primary + '10' : 'transparent',
                                            borderColor: member.selected ? Colors.primary + '30' : colors.borderLight,
                                        },
                                    ]}
                                    onPress={() => toggleMember(member.uid)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.memberLeft}>
                                        <Avatar name={member.displayName} size={36} />
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={[styles.memberName, { color: colors.text }]}>
                                                {member.displayName}
                                            </Text>
                                            <Text style={[styles.memberEmail, { color: colors.textTertiary }]}>
                                                {member.email}
                                            </Text>
                                        </View>
                                    </View>
                                    <View
                                        style={[
                                            styles.checkbox,
                                            {
                                                backgroundColor: member.selected ? Colors.primary : 'transparent',
                                                borderColor: member.selected ? Colors.primary : colors.textTertiary,
                                            },
                                        ]}
                                    >
                                        {member.selected && (
                                            <Ionicons name="checkmark" size={14} color="#FFF" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}

                        {!loadingMembers && members.length === 0 && (
                            <Text style={[styles.noMembers, { color: colors.textTertiary }]}>
                                Firma üyesi bulunamadı
                            </Text>
                        )}
                    </View>
                )}

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.7 }]}
                    onPress={handleSend}
                    disabled={sending}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2'] as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.sendBtnInner}
                    >
                        {sending ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#FFF" />
                                <Text style={styles.sendBtnText}>Duyuruyu Gönder</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 20,
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
    content: { padding: Spacing.xl },

    label: { fontSize: 14, fontWeight: '700', marginBottom: Spacing.sm, marginTop: Spacing.lg },
    input: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        fontSize: 15,
    },
    messageInput: {
        minHeight: 120,
        textAlignVertical: 'top',
    },

    // Target
    targetSection: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        marginTop: Spacing.xl,
    },
    targetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    targetTitle: { fontSize: 16, fontWeight: '700' },
    targetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    targetOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    targetOptionTitle: { fontSize: 15, fontWeight: '600' },
    targetOptionSub: { fontSize: 12, marginTop: 2 },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
    },

    // Members
    membersSection: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        marginTop: Spacing.lg,
    },
    membersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    membersTitle: { fontSize: 15, fontWeight: '700' },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.xs,
    },
    memberLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    memberName: { fontSize: 14, fontWeight: '600' },
    memberEmail: { fontSize: 11, marginTop: 1 },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMembers: { fontSize: 13, textAlign: 'center', padding: Spacing.xl },

    // Send
    sendBtn: { marginTop: Spacing.xxl },
    sendBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        gap: 10,
    },
    sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
