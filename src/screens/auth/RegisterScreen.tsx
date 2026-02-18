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
import { registerUser } from '../../services/authService';

interface RegisterScreenProps {
    onNavigateLogin: () => void;
}

export function RegisterScreen({ onNavigateLogin }: RegisterScreenProps) {
    const { colors } = useTheme();
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateStep1 = () => {
        const e: Record<string, string> = {};
        if (!companyName.trim()) e.companyName = 'Firma adı gerekli';
        if (!displayName.trim()) e.displayName = 'Ad Soyad gerekli';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: Record<string, string> = {};
        if (!email.trim()) e.email = 'E-posta gerekli';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Geçerli bir e-posta girin';
        if (!password) e.password = 'Şifre gerekli';
        else if (password.length < 6) e.password = 'En az 6 karakter';
        if (password !== confirmPassword) e.confirmPassword = 'Şifreler eşleşmiyor';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) setStep(2);
    };

    const handleRegister = async () => {
        if (!validateStep2()) return;
        setLoading(true);
        try {
            await registerUser(email.trim(), password, displayName.trim(), companyName.trim());
        } catch (error: any) {
            Alert.alert('Kayıt Hatası', error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
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
                    <LinearGradient
                        colors={Colors.gradientPrimary as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <TouchableOpacity onPress={onNavigateLogin} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.logoCircle}>
                            <Ionicons name="business" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.headerTitle}>Firma Oluştur</Text>
                        <Text style={styles.headerSubtitle}>
                            {step === 1 ? 'Firma ve yönetici bilgileri' : 'Hesap bilgileri'}
                        </Text>

                        {/* Step Indicator */}
                        <View style={styles.stepRow}>
                            <View style={[styles.stepDot, styles.stepActive]} />
                            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                            <View style={[styles.stepDot, step >= 2 && styles.stepActive]} />
                        </View>
                    </LinearGradient>

                    {/* Form */}
                    <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
                        {step === 1 ? (
                            <>
                                <Text style={[styles.formTitle, { color: colors.text }]}>Firma Bilgileri</Text>

                                <InputField
                                    label="Firma Adı"
                                    icon="business-outline"
                                    placeholder="Örn: ABC Teknoloji"
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                    error={errors.companyName}
                                />

                                <InputField
                                    label="Ad Soyad (Yönetici)"
                                    icon="person-outline"
                                    placeholder="Ahmet Yılmaz"
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    error={errors.displayName}
                                />

                                <PremiumButton
                                    title="Devam Et"
                                    onPress={handleNext}
                                    size="lg"
                                    icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
                                    style={styles.actionButton}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={[styles.formTitle, { color: colors.text }]}>Hesap Bilgileri</Text>

                                <InputField
                                    label="E-posta"
                                    icon="mail-outline"
                                    placeholder="ornek@firma.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={errors.email}
                                />

                                <InputField
                                    label="Şifre"
                                    icon="lock-closed-outline"
                                    placeholder="En az 6 karakter"
                                    value={password}
                                    onChangeText={setPassword}
                                    isPassword
                                    error={errors.password}
                                />

                                <InputField
                                    label="Şifre Tekrar"
                                    icon="lock-closed-outline"
                                    placeholder="Şifrenizi tekrar girin"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    isPassword
                                    error={errors.confirmPassword}
                                />

                                <View style={styles.buttonRow}>
                                    <PremiumButton
                                        title="Geri"
                                        onPress={() => setStep(1)}
                                        variant="outline"
                                        size="lg"
                                        style={styles.halfButton}
                                    />
                                    <PremiumButton
                                        title="Kayıt Ol"
                                        onPress={handleRegister}
                                        loading={loading}
                                        size="lg"
                                        style={styles.halfButton}
                                    />
                                </View>
                            </>
                        )}

                        <TouchableOpacity onPress={onNavigateLogin} style={styles.loginLink}>
                            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
                                Zaten hesabınız var mı?{' '}
                            </Text>
                            <Text style={[styles.loginLinkBold, { color: Colors.primary }]}>
                                Giriş Yap
                            </Text>
                        </TouchableOpacity>
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
    logoCircle: {
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
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 0,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    stepActive: {
        backgroundColor: '#FFF',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    stepLineActive: {
        backgroundColor: '#FFF',
    },
    formCard: {
        marginTop: -20,
        marginHorizontal: 20,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xxl,
        paddingTop: 28,
        flex: 1,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
    },
    actionButton: {
        marginTop: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    halfButton: {
        flex: 1,
    },
    loginLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.xxl,
    },
    loginLinkText: {
        fontSize: 14,
    },
    loginLinkBold: {
        fontSize: 14,
        fontWeight: '700',
    },
});
