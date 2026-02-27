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
import { useNavigation } from '@react-navigation/native';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { registerUser } from '../../services/authService';
import { PLAN_DETAILS, PlanType } from '../../constants/plans';

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
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [isKvkkAccepted, setIsKvkkAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const navigation = useNavigation<any>();

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
        if (step === 1 && validateStep1()) setStep(2);
        else if (step === 2 && validateStep2()) setStep(3);
    };

    const validateStep3 = () => {
        if (!isTermsAccepted || !isKvkkAccepted) {
            Alert.alert('Eksik Bilgi', 'Kayıt olabilmek için Kullanıcı Sözleşmesi ve KVKK metnini onaylamanız gerekmektedir.');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validateStep2() || !validateStep3()) return;
        setLoading(true);
        try {
            await registerUser(email.trim(), password, displayName.trim(), companyName.trim(), selectedPlan);
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
                            {step === 1 ? 'Firma ve yönetici bilgileri' : step === 2 ? 'Hesap bilgileri' : 'Abonelik Planı Seçimi'}
                        </Text>

                        {/* Step Indicator */}
                        <View style={styles.stepRow}>
                            <View style={[styles.stepDot, styles.stepActive]} />
                            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                            <View style={[styles.stepDot, step >= 2 && styles.stepActive]} />
                            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
                            <View style={[styles.stepDot, step >= 3 && styles.stepActive]} />
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
                        ) : step === 2 ? (
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
                                        title="Devam Et"
                                        onPress={handleNext}
                                        size="lg"
                                        style={styles.halfButton}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.formTitle, { color: colors.text }]}>Plan Seçimi</Text>

                                {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
                                    const isSelected = selectedPlan === key;
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            onPress={() => setSelectedPlan(key as PlanType)}
                                            activeOpacity={0.9}
                                            style={[
                                                styles.planCard,
                                                {
                                                    borderColor: isSelected ? Colors.primary : colors.border,
                                                    backgroundColor: isSelected ? Colors.primary + '10' : colors.card,
                                                }
                                            ]}
                                        >
                                            <View style={styles.planHeader}>
                                                <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                                                    <Ionicons name="star" size={16} color={plan.color} />
                                                </View>
                                                <View style={styles.flex}>
                                                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                                                    <Text style={[styles.planLimit, { color: colors.textSecondary }]}>{plan.userLimit} Kullanıcı</Text>
                                                </View>
                                                <Text style={[styles.planPrice, { color: Colors.primary }]}>
                                                    {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price}/ay`}
                                                </Text>
                                            </View>
                                            <View style={styles.planDivider} />
                                            <View style={styles.featuresList}>
                                                {plan.features.slice(0, 3).map((feature, i) => (
                                                    <View key={i} style={styles.featureItem}>
                                                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}

                                <View style={styles.agreementsContainer}>
                                    <TouchableOpacity style={styles.agreementRow} onPress={() => setIsTermsAccepted(!isTermsAccepted)} activeOpacity={0.7}>
                                        <Ionicons name={isTermsAccepted ? "checkbox" : "square-outline"} size={22} color={isTermsAccepted ? Colors.primary : colors.textSecondary} />
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
                                                <Text style={{ color: Colors.primary, fontWeight: 'bold' }} onPress={() => navigation.navigate('TermsOfService')}>Kullanıcı Sözleşmesini</Text> okudum ve kabul ediyorum.
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.agreementRow} onPress={() => setIsKvkkAccepted(!isKvkkAccepted)} activeOpacity={0.7}>
                                        <Ionicons name={isKvkkAccepted ? "checkbox" : "square-outline"} size={22} color={isKvkkAccepted ? Colors.primary : colors.textSecondary} />
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
                                                <Text style={{ color: Colors.primary, fontWeight: 'bold' }} onPress={() => navigation.navigate('Kvkk')}>KVKK Aydınlatma Metnini</Text> okudum ve açık rızam ile kabul ediyorum.
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.buttonRow}>
                                    <PremiumButton
                                        title="Geri"
                                        onPress={() => setStep(2)}
                                        variant="outline"
                                        size="lg"
                                        style={styles.halfButton}
                                    />
                                    <PremiumButton
                                        title="Kaydı Tamamla"
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
    planCard: {
        borderWidth: 2,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    planIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    planName: {
        fontSize: 16,
        fontWeight: '700',
    },
    planLimit: {
        fontSize: 13,
    },
    planPrice: {
        fontSize: 15,
        fontWeight: '700',
    },
    planDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 12,
    },
    featuresList: {
        gap: 6,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 12,
    },
    agreementsContainer: {
        marginTop: Spacing.sm,
        marginBottom: Spacing.xl,
        gap: Spacing.md,
    },
    agreementRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    agreementText: {
        fontSize: 12,
        lineHeight: 18,
    },
});
