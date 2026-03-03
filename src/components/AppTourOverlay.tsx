import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme/theme';

const { width, height } = Dimensions.get('window');

interface AppTourOverlayProps {
    visible: boolean;
    onFinish: () => void;
}

const TOUR_STEPS = [
    {
        id: '1',
        title: 'WorkFlow\'a\nHoş Geldiniz!',
        description: 'İş süreçlerinizi, izinlerinizi ve masraflarınızı tek bir yerden kolayca yönetin. Size uygulamayı hızlıca tanıtalım.',
        icon: 'briefcase',
        gradient: ['#4F46E5', '#7C3AED'] as const,
        iconBg: '#4F46E520',
    },
    {
        id: '2',
        title: 'İzin Yönetimi',
        description: 'Yıllık izin, hastalık izni veya ücretsiz izin taleplerinizi kolayca oluşturun. Talebiniz anında yöneticinize iletilir ve durumunu takip edebilirsiniz.',
        icon: 'calendar',
        gradient: ['#059669', '#10B981'] as const,
        iconBg: '#05966920',
    },
    {
        id: '3',
        title: 'Masraf Takibi',
        description: 'Fiş veya fatura fotoğrafı çekin, tutarı girin ve onaya gönderin. Onaylanan masraflarınızın geri ödeme durumunu takip edin.',
        icon: 'receipt',
        gradient: ['#D97706', '#F59E0B'] as const,
        iconBg: '#D9770620',
    },
    {
        id: '4',
        title: 'Yoklama Sistemi',
        description: 'Her gün yöneticinizin oluşturduğu QR kodu tarayarak yoklamanızı verin. Hızlı, güvenli ve konum bağımsız.',
        icon: 'scan',
        gradient: ['#0369A1', '#0EA5E9'] as const,
        iconBg: '#0369A120',
    },
    {
        id: '5',
        title: 'Bildirimler',
        description: 'İzin onayları, masraf güncellemeleri ve firma duyurularından anında haberdar olun. Hiçbir gelişmeyi kaçırmayın.',
        icon: 'notifications',
        gradient: ['#DC2626', '#EF4444'] as const,
        iconBg: '#DC262620',
    },
    {
        id: '6',
        title: 'Hazırsınız!',
        description: 'Uygulamayı keşfetmeye başlayın. Alt menüden tüm özelliklere kolayca ulaşabilirsiniz. İyi çalışmalar!',
        icon: 'rocket',
        gradient: ['#7C3AED', '#A855F7'] as const,
        iconBg: '#7C3AED20',
    },
];

export function AppTourOverlay({ visible, onFinish }: AppTourOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [animKey, setAnimKey] = useState(0);

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    const handleNext = useCallback(() => {
        if (isLastStep) {
            onFinish();
        } else {
            setAnimKey((k) => k + 1);
            setCurrentStep((s) => s + 1);
        }
    }, [isLastStep, onFinish]);

    const handleSkip = useCallback(() => {
        onFinish();
    }, [onFinish]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <LinearGradient
                    colors={['rgba(15,15,35,0.97)', 'rgba(15,15,35,0.92)']}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Skip Button */}
                {!isLastStep && (
                    <Animated.View
                        entering={FadeIn.delay(300)}
                        style={styles.skipContainer}
                    >
                        <TouchableOpacity
                            onPress={handleSkip}
                            style={styles.skipButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipText}>Atla</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Main Content */}
                <View style={styles.contentContainer}>
                    <Animated.View
                        key={`step-${animKey}`}
                        entering={currentStep === 0 ? FadeInDown.duration(600) : SlideInRight.duration(400)}
                        style={styles.stepCard}
                    >
                        {/* Step Counter */}
                        <Animated.View
                            entering={FadeIn.delay(200)}
                            style={styles.stepCounter}
                        >
                            <Text style={styles.stepCounterText}>
                                {currentStep + 1} / {TOUR_STEPS.length}
                            </Text>
                        </Animated.View>

                        {/* Title */}
                        <Text style={styles.title}>{step.title}</Text>

                        {/* Description */}
                        <Text style={styles.description}>{step.description}</Text>
                    </Animated.View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {TOUR_STEPS.map((_, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: index === currentStep
                                            ? '#FFF'
                                            : 'rgba(255,255,255,0.25)',
                                        width: index === currentStep ? 28 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        onPress={handleNext}
                        activeOpacity={0.85}
                        style={styles.actionButtonWrapper}
                    >
                        <LinearGradient
                            colors={step.gradient}
                            style={styles.actionButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionButtonText}>
                                {isLastStep ? 'Başlayalım!' : 'İleri'}
                            </Text>
                            {!isLastStep && (
                                <Ionicons
                                    name="arrow-forward"
                                    size={20}
                                    color="#FFF"
                                    style={{ marginLeft: 8 }}
                                />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipContainer: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    skipText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    stepCard: {
        alignItems: 'center',
        width: '100%',
    },
    stepCounter: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        marginBottom: 20,
    },
    stepCounterText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
        lineHeight: 38,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 8,
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: 50,
        width: '100%',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    actionButtonWrapper: {
        width: '100%',
        ...Shadows.medium,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: BorderRadius.lg,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
