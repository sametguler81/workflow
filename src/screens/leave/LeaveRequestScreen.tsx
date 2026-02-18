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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';
import { GradientCard } from '../../components/GradientCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import { createLeaveRequest, LeaveType } from '../../services/leaveService';

interface LeaveRequestScreenProps {
    onBack: () => void;
}

const leaveTypes: { value: LeaveType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { value: 'yillik', label: 'Yıllık İzin', icon: 'sunny-outline', color: Colors.warning },
    { value: 'hastalik', label: 'Hastalık İzni', icon: 'medical-outline', color: Colors.danger },
    { value: 'ucretsiz', label: 'Ücretsiz İzin', icon: 'time-outline', color: Colors.info },
];

export function LeaveRequestScreen({ onBack }: LeaveRequestScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [type, setType] = useState<LeaveType>('yillik');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Uyarı', 'Başlangıç ve bitiş tarihi gerekli.');
            return;
        }
        if (!profile) return;

        setLoading(true);
        try {
            await createLeaveRequest({
                userId: profile.uid,
                userName: profile.displayName,
                companyId: profile.companyId,
                type,
                startDate,
                endDate,
                description,
            });
            Alert.alert('Başarılı ✅', 'İzin talebiniz oluşturuldu.', [
                { text: 'Tamam', onPress: onBack },
            ]);
        } catch (err) {
            Alert.alert('Hata', 'İzin talebi oluşturulamadı.');
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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>İzin Talebi</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.form}>
                        {/* Leave Type Selection */}
                        <Text style={[styles.label, { color: colors.textSecondary }]}>İzin Türü</Text>
                        <View style={styles.typeRow}>
                            {leaveTypes.map((lt) => (
                                <TouchableOpacity
                                    key={lt.value}
                                    style={[
                                        styles.typeCard,
                                        {
                                            backgroundColor: type === lt.value ? lt.color + '15' : colors.card,
                                            borderColor: type === lt.value ? lt.color : colors.borderLight,
                                            borderWidth: type === lt.value ? 2 : 1,
                                        },
                                    ]}
                                    onPress={() => setType(lt.value)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={lt.icon} size={24} color={lt.color} />
                                    <Text
                                        style={[
                                            styles.typeLabel,
                                            { color: type === lt.value ? lt.color : colors.textSecondary },
                                        ]}
                                    >
                                        {lt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date Inputs */}
                        <InputField
                            label="Başlangıç Tarihi"
                            icon="calendar-outline"
                            placeholder="GG.AA.YYYY (örn: 15.03.2026)"
                            value={startDate}
                            onChangeText={setStartDate}
                        />

                        <InputField
                            label="Bitiş Tarihi"
                            icon="calendar-outline"
                            placeholder="GG.AA.YYYY (örn: 20.03.2026)"
                            value={endDate}
                            onChangeText={setEndDate}
                        />

                        {/* Description */}
                        <InputField
                            label="Açıklama (Opsiyonel)"
                            icon="document-text-outline"
                            placeholder="İzin sebebinizi yazın..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top', paddingTop: 12 }}
                        />

                        {/* Submit */}
                        <PremiumButton
                            title="İzin Talebi Gönder"
                            onPress={handleSubmit}
                            loading={loading}
                            size="lg"
                            icon={<Ionicons name="send" size={18} color="#FFF" />}
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    form: {
        padding: Spacing.xl,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        letterSpacing: 0.3,
    },
    typeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    typeCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: 6,
    },
    typeLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
});
