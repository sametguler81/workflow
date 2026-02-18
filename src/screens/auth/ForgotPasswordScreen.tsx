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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { resetPassword } from '../../services/authService';

interface ForgotPasswordScreenProps {
    onNavigateLogin: () => void;
}

export function ForgotPasswordScreen({ onNavigateLogin }: ForgotPasswordScreenProps) {
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async () => {
        if (!email.trim()) {
            setError('E-posta gerekli');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Geçerli bir e-posta girin');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await resetPassword(email.trim());
            setSent(true);
        } catch (err: any) {
            Alert.alert('Hata', 'Şifre sıfırlama e-postası gönderilemedi.');
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
                    <LinearGradient
                        colors={Colors.gradientPrimary as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <TouchableOpacity onPress={onNavigateLogin} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.iconCircle}>
                            <Ionicons name="key" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.headerTitle}>Şifre Sıfırlama</Text>
                        <Text style={styles.headerSubtitle}>
                            E-posta adresinize sıfırlama linki göndereceğiz
                        </Text>
                    </LinearGradient>

                    <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
                        {sent ? (
                            <View style={styles.successContainer}>
                                <View style={[styles.successIcon, { backgroundColor: Colors.successLight }]}>
                                    <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
                                </View>
                                <Text style={[styles.successTitle, { color: colors.text }]}>
                                    E-posta Gönderildi! 📩
                                </Text>
                                <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                                    {email} adresine şifre sıfırlama linki gönderdik. Lütfen e-postanızı kontrol edin.
                                </Text>
                                <PremiumButton
                                    title="Giriş Ekranına Dön"
                                    onPress={onNavigateLogin}
                                    size="lg"
                                    style={{ marginTop: Spacing.xxl }}
                                />
                            </View>
                        ) : (
                            <>
                                <InputField
                                    label="E-posta Adresi"
                                    icon="mail-outline"
                                    placeholder="ornek@firma.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={error}
                                />
                                <PremiumButton
                                    title="Sıfırlama Linki Gönder"
                                    onPress={handleReset}
                                    loading={loading}
                                    size="lg"
                                    icon={<Ionicons name="send" size={18} color="#FFF" />}
                                />
                            </>
                        )}
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
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    backButton: {
        position: 'absolute',
        top: 55,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    formCard: {
        marginTop: -20,
        marginHorizontal: 20,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xxl,
        paddingTop: 32,
        flex: 1,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: Spacing.sm,
    },
    successMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
});
