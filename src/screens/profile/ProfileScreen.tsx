import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Avatar } from '../../components/Avatar';
import { GradientCard } from '../../components/GradientCard';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';

const roleLabels: Record<string, string> = {
    admin: 'Yönetici',
    personel: 'Personel',
    idari: 'İdari',
    muhasebe: 'Muhasebe',
};

const roleColors: Record<string, string> = {
    admin: Colors.primary,
    personel: Colors.info,
    idari: '#764ba2',
    muhasebe: '#11998e',
};

interface ProfileScreenProps {
    onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();

    if (!profile) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={Colors.gradientPrimary as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Avatar name={profile.displayName} size={80} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.name}>{profile.displayName}</Text>
                    <Text style={styles.email}>{profile.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleColors[profile.role] + '30' }]}>
                        <Text style={[styles.roleText, { color: '#FFF' }]}>
                            {roleLabels[profile.role] || profile.role}
                        </Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Info Card */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                        <InfoRow icon="business-outline" label="Firma" value={profile.companyName || '-'} colors={colors} />
                        <InfoRow icon="shield-checkmark-outline" label="Rol" value={roleLabels[profile.role] || profile.role} colors={colors} />
                        <InfoRow icon="mail-outline" label="E-posta" value={profile.email} colors={colors} />
                        <InfoRow
                            icon="calendar-outline"
                            label="Kayıt Tarihi"
                            value={new Date(profile.createdAt).toLocaleDateString('tr-TR')}
                            colors={colors}
                            isLast
                        />
                    </View>

                    {/* Subscription Info */}
                    <GradientCard gradient={Colors.gradientCard} style={styles.subCard}>
                        <View style={styles.subContent}>
                            <Ionicons name="diamond" size={28} color="#FFF" />
                            <View style={styles.subInfo}>
                                <Text style={styles.subTitle}>Abonelik Planı</Text>
                                <Text style={styles.subPlan}>Free Plan</Text>
                            </View>
                        </View>
                        <Text style={styles.subLimit}>5 kullanıcıya kadar • Temel özellikler</Text>
                    </GradientCard>
                </View>
            </ScrollView>
        </View>
    );
}

function InfoRow({ icon, label, value, colors, isLast }: any) {
    return (
        <View style={[infoStyles.row, !isLast && { borderBottomWidth: 0.5, borderBottomColor: colors.borderLight }]}>
            <View style={infoStyles.left}>
                <Ionicons name={icon} size={20} color={colors.textTertiary} />
                <Text style={[infoStyles.label, { color: colors.textTertiary }]}>{label}</Text>
            </View>
            <Text style={[infoStyles.value, { color: colors.text }]}>{value}</Text>
        </View>
    );
}

const infoStyles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    label: { fontSize: 14, fontWeight: '500' },
    value: { fontSize: 14, fontWeight: '600' },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 16 },
    email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    roleBadge: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleText: { fontSize: 13, fontWeight: '700' },
    content: { padding: Spacing.xl, marginTop: -16 },
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        ...Shadows.small,
    },
    subCard: { marginBottom: Spacing.xl },
    subContent: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
    subInfo: {},
    subTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
    subPlan: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    subLimit: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});
