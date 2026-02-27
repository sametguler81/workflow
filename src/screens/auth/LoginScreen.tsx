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
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../../components/InputField';
import { PremiumButton } from '../../components/PremiumButton';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';
import { loginUser } from '../../services/authService';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
    onNavigateRegister: () => void;
    onNavigateForgotPassword: () => void;
}

export function LoginScreen({ onNavigateRegister, onNavigateForgotPassword }: LoginScreenProps) {
    const { colors, isDark } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!email.trim()) newErrors.email = 'E-posta gerekli';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Geçerli bir e-posta girin';
        if (!password) newErrors.password = 'Şifre gerekli';
        else if (password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalı';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await loginUser(email.trim(), password);
        } catch (error: any) {
            Alert.alert('Giriş Hatası', 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
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
                    {/* Header Gradient */}
                    <LinearGradient
                        colors={Colors.gradientPrimary as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../../../assets/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                        <Text style={styles.appName}>WorkFlow360</Text>
                        <Text style={styles.appSubtitle}>Kurumsal İzin & Gider Yönetimi</Text>
                    </LinearGradient>

                    {/* Form Card */}
                    <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Hoş Geldiniz</Text>
                        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                            Hesabınıza giriş yapın
                        </Text>

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
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            isPassword
                            error={errors.password}
                        />

                        <TouchableOpacity
                            onPress={onNavigateForgotPassword}
                            style={styles.forgotButton}
                        >
                            <Text style={[styles.forgotText, { color: Colors.primary }]}>
                                Şifremi Unuttum
                            </Text>
                        </TouchableOpacity>

                        <PremiumButton
                            title="Giriş Yap"
                            onPress={handleLogin}
                            loading={loading}
                            size="lg"
                            style={styles.loginButton}
                        />

                        <View style={styles.dividerRow}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>veya</Text>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </View>

                        <TouchableOpacity
                            onPress={onNavigateRegister}
                            style={[styles.registerButton, { borderColor: colors.border }]}
                        >
                            <Text style={[styles.registerText, { color: colors.text }]}>
                                Yeni Firma Oluştur
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
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
        paddingTop: 80,
        paddingBottom: 50,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    logoContainer: { marginBottom: 16 },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    appName: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    appSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        fontWeight: '500',
    },
    formCard: {
        marginTop: -24,
        marginHorizontal: 20,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.xxl,
        paddingTop: 32,
        flex: 1,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 14,
        marginBottom: 28,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
        marginTop: -Spacing.sm,
    },
    forgotText: {
        fontSize: 13,
        fontWeight: '600',
    },
    loginButton: {
        marginBottom: Spacing.xl,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 13,
        fontWeight: '500',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
    },
    registerText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
