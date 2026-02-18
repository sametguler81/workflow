import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../../components/Avatar';
import { PremiumButton } from '../../components/PremiumButton';
import { InputField } from '../../components/InputField';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { getCompanyMembers, updateUserRole } from '../../services/companyService';
import {
    getAuth,
    createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc } from '@react-native-firebase/firestore';
import { getApp, initializeApp } from '@react-native-firebase/app';

const roleLabels: Record<string, string> = {
    admin: 'Yönetici',
    personel: 'Personel',
    idari: 'İdari',
    muhasebe: 'Muhasebe',
};

interface CompanyManagementScreenProps {
    onBack: () => void;
}

export function CompanyManagementScreen({ onBack }: CompanyManagementScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'personel' | 'idari' | 'muhasebe'>('personel');
    const [registering, setRegistering] = useState(false);

    const loadMembers = useCallback(async () => {
        if (!profile) return;
        try {
            const data = await getCompanyMembers(profile.companyId);
            setMembers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => { loadMembers(); }, [loadMembers]);

    const handleRegister = async () => {
        if (!newEmail || !newName || !newPassword || !profile) {
            Alert.alert('Uyarı', 'Tüm alanlar gerekli.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Uyarı', 'Şifre en az 6 karakter olmalı.');
            return;
        }
        setRegistering(true);

        // Use a secondary app to create user without logging out the current admin
        let secondaryApp = null;
        try {
            const app = getApp();
            // Create a unique name for the secondary app to avoid conflicts
            const secondaryAppName = `secondary_${Date.now()}`;

            // Construct options manually to ensure all required fields are present
            // Sometimes app.options misses fields on native
            const options = {
                apiKey: app.options.apiKey,
                appId: app.options.appId,
                projectId: app.options.projectId,
                messagingSenderId: app.options.messagingSenderId,
                storageBucket: app.options.storageBucket,
                // Add databaseURL if missing (required for some SDK versions even if using Firestore)
                databaseURL: app.options.databaseURL || `https://${app.options.projectId}.firebaseio.com`,
            };

            secondaryApp = await initializeApp(options, secondaryAppName);

            const secondaryAuth = getAuth(secondaryApp);
            const cred = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);

            // Use the PRIMARY (admin) firestore instance to write the user profile
            // This ensures we have admin permissions if needed
            const db = getFirestore(); // Default app's firestore

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', cred.user.uid), {
                uid: cred.user.uid,
                email: newEmail,
                displayName: newName,
                role: newRole,
                companyId: profile.companyId,
                companyName: profile.companyName || '',
                createdAt: new Date().toISOString(),
            });

            Alert.alert('Başarılı ✅', `${newName} başarıyla eklendi.`);

            // Clean up
            setShowRegister(false);
            setNewEmail('');
            setNewName('');
            setNewPassword('');

            // Reload members
            await loadMembers();

        } catch (err: any) {
            console.error(err);
            const msg = err.code === 'auth/email-already-in-use'
                ? 'Bu e-posta adresi zaten kullanılıyor.'
                : err.code === 'auth/weak-password'
                    ? 'Şifre çok zayıf.'
                    : err.code === 'auth/invalid-email'
                        ? 'Geçersiz e-posta adresi.'
                        : 'Kullanıcı oluşturulamadı: ' + err.message;
            Alert.alert('Hata', msg);
        } finally {
            setRegistering(false);
            if (secondaryApp) {
                try {
                    await (secondaryApp as any).delete();
                } catch (e) {
                    console.log('Error deleting secondary app', e);
                }
            }
        }
    };

    if (loading) return <LoadingSpinner message="Yükleniyor..." />;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Firma Yönetimi</Text>
                <TouchableOpacity onPress={() => setShowRegister(!showRegister)}>
                    <Ionicons name={showRegister ? 'close' : 'person-add'} size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Register Form */}
            {showRegister && (
                <View style={[styles.registerCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <Text style={[styles.registerTitle, { color: colors.text }]}>Yeni Kullanıcı Ekle</Text>

                    <InputField
                        label="Ad Soyad"
                        icon="person-outline"
                        placeholder="Ahmet Yılmaz"
                        value={newName}
                        onChangeText={setNewName}
                    />
                    <InputField
                        label="E-posta"
                        icon="mail-outline"
                        placeholder="ornek@firma.com"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <InputField
                        label="Şifre"
                        icon="lock-closed-outline"
                        placeholder="En az 6 karakter"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />

                    <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>Rol</Text>
                    <View style={styles.roleRow}>
                        {(['personel', 'idari', 'muhasebe'] as const).map((r) => (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    styles.roleChip,
                                    {
                                        backgroundColor: newRole === r ? Colors.primary : colors.surfaceVariant,
                                    },
                                ]}
                                onPress={() => setNewRole(r)}
                            >
                                <Text style={{ color: newRole === r ? '#FFF' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                                    {roleLabels[r]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <PremiumButton
                        title="Kaydet"
                        onPress={handleRegister}
                        loading={registering}
                        icon={<Ionicons name="checkmark-circle" size={16} color="#FFF" />}
                        style={{ marginTop: Spacing.md }}
                    />
                </View>
            )}

            {/* Members List */}
            <FlatList
                data={members}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
                        {members.length} Üye
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <Avatar name={item.displayName || 'U'} size={44} />
                        <View style={styles.memberInfo}>
                            <Text style={[styles.memberName, { color: colors.text }]}>{item.displayName}</Text>
                            <Text style={[styles.memberEmail, { color: colors.textTertiary }]}>{item.email}</Text>
                        </View>
                        <View style={[styles.memberRole, { backgroundColor: Colors.primary + '15' }]}>
                            <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '700' }}>
                                {roleLabels[item.role] || item.role}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    registerCard: {
        margin: Spacing.xl,
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        ...Shadows.small,
    },
    registerTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.lg },
    roleLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, marginTop: -Spacing.sm },
    roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    roleChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    list: { paddingHorizontal: Spacing.xl, paddingBottom: 30 },
    memberCount: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.md },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        gap: Spacing.md,
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 15, fontWeight: '600' },
    memberEmail: { fontSize: 12, marginTop: 2 },
    memberRole: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
});
