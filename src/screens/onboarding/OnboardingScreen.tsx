import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Image,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
    onFinish: () => void;
}

const SLIDES = [
    {
        id: '1',
        title: 'WorkFlow\'a Hoş Geldiniz',
        description: 'İş süreçlerinizi, izinlerinizi ve masraflarınızı tek bir yerden kolayca yönetin.',
        icon: 'briefcase-outline',
        color: '#4F46E5', // Indigo
    },
    {
        id: '2',
        title: 'Kolay Yönetim',
        description: 'Personel izinlerini takip edin, masraf fişlerini taratın ve anında onaylayın.',
        icon: 'document-text-outline',
        color: '#059669', // Emerald
    },
    {
        id: '3',
        title: 'Size Uygun Planlar',
        description: 'İster küçük bir ekip olun, ister büyük bir şirket. Her ölçeğe uygun esnek planlar.',
        icon: 'rocket-outline',
        color: '#D97706', // Amber
    },
];

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
    const { colors, isDark } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            onFinish();
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            onFinish(); // Proceed anyway
        }
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={80} color={item.color} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                    {item.title}
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {item.description}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={[styles.skipText, { color: colors.textTertiary }]}>Atla</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
                bounces={false}
            />

            <View style={styles.footer}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentIndex ? Colors.primary : colors.border,
                                    width: index === currentIndex ? 24 : 8
                                }
                            ]}
                        />
                    ))}
                </View>

                {/* Primary Button */}
                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.button, { backgroundColor: Colors.primary }]}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Başla' : 'İleri'}
                    </Text>
                    {currentIndex !== SLIDES.length - 1 && (
                        <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    skipButton: {
        padding: Spacing.sm,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl * 1.5,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
        ...Shadows.medium,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
