import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';
import { checkIn, hasCheckedInToday } from '../../services/attendanceService';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

interface AttendanceScanScreenProps {
    onBack: () => void;
    onNavigateReport?: () => void;
}

export function AttendanceScanScreen({ onBack, onNavigateReport }: AttendanceScanScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [resultSuccess, setResultSuccess] = useState(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const successAnim = useRef(new Animated.Value(0)).current;

    // Pulse animation for scanner frame
    useEffect(() => {
        if (!scanned && !alreadyCheckedIn) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [scanned, alreadyCheckedIn]);

    // Check if already checked in today
    useEffect(() => {
        async function check() {
            if (!profile) return;
            try {
                const checked = await hasCheckedInToday(profile.uid, profile.companyId);
                setAlreadyCheckedIn(checked);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        check();
    }, [profile]);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || !profile) return;
        setScanned(true);

        try {
            const result = await checkIn(
                profile.uid,
                profile.displayName,
                profile.companyId,
                data
            );

            setResultMessage(result.message);
            setResultSuccess(result.success);

            if (result.success) {
                setAlreadyCheckedIn(true);
                Animated.spring(successAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 5,
                }).start();
            }
        } catch (err) {
            setResultMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
            setResultSuccess(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setResultMessage(null);
        setResultSuccess(false);
    };

    if (!permission) return null;

    if (!permission.granted) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <LinearGradient
                    colors={['#00C48C', '#00D2FF'] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yoklama Tara</Text>
                    <View style={{ width: 24 }} />
                </LinearGradient>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={56} color={colors.textTertiary} />
                    <Text style={[styles.permissionTitle, { color: colors.text }]}>
                        Kamera İzni Gerekli
                    </Text>
                    <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
                        QR kod taramak için kamera erişimine izin vermeniz gerekmektedir.
                    </Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                        <LinearGradient
                            colors={Colors.gradientPrimary as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.permissionBtnInner}
                        >
                            <Text style={styles.permissionBtnText}>İzin Ver</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Already checked in today view
    if (alreadyCheckedIn && !resultMessage) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <LinearGradient
                    colors={['#00C48C', '#00D2FF'] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yoklama</Text>
                    <View style={{ width: 24 }} />
                </LinearGradient>
                <View style={styles.checkedInContainer}>
                    <View style={styles.checkedInIcon}>
                        <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
                    </View>
                    <Text style={[styles.checkedInTitle, { color: colors.text }]}>
                        Bugün Yoklama Verildi ✅
                    </Text>
                    <Text style={[styles.checkedInSubtitle, { color: colors.textSecondary }]}>
                        Bugünkü yoklamanız başarıyla kaydedilmiştir. Yarın tekrar yoklama verebilirsiniz.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            {/* Camera */}
            {!scanned && (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
            )}

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.cameraHeader}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>QR Kod Tara</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Scanner Frame */}
                {!scanned && (
                    <View style={styles.scannerArea}>
                        <Animated.View
                            style={[
                                styles.scannerFrame,
                                { transform: [{ scale: pulseAnim }] },
                            ]}
                        >
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </Animated.View>
                        <Text style={styles.scanText}>
                            QR kodu çerçevenin içine hizalayın
                        </Text>
                    </View>
                )}

                {/* Result */}
                {resultMessage && (
                    <View style={styles.resultContainer}>
                        <Animated.View
                            style={[
                                styles.resultCard,
                                {
                                    backgroundColor: colors.card,
                                    transform: [{ scale: resultSuccess ? successAnim : 1 }],
                                },
                            ]}
                        >
                            <Ionicons
                                name={resultSuccess ? 'checkmark-circle' : 'close-circle'}
                                size={48}
                                color={resultSuccess ? Colors.success : Colors.danger}
                            />
                            <Text style={[styles.resultTitle, { color: colors.text }]}>
                                {resultSuccess ? 'Başarılı!' : 'Hata'}
                            </Text>
                            <Text style={[styles.resultText, { color: colors.textSecondary }]}>
                                {resultMessage}
                            </Text>
                            {!resultSuccess && (
                                <TouchableOpacity onPress={resetScanner} style={styles.retryBtn}>
                                    <LinearGradient
                                        colors={Colors.gradientPrimary as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.retryBtnInner}
                                    >
                                        <Ionicons name="refresh" size={18} color="#FFF" />
                                        <Text style={styles.retryBtnText}>Tekrar Dene</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onBack} style={styles.doneBtn}>
                                <Text style={[styles.doneBtnText, { color: Colors.primary }]}>
                                    Tamam
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    // Permission
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxxl,
        gap: Spacing.lg,
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    permissionBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginTop: Spacing.lg,
    },
    permissionBtnInner: {
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: BorderRadius.lg,
    },
    permissionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Already checked in
    checkedInContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxxl,
        gap: Spacing.md,
    },
    checkedInIcon: {
        marginBottom: Spacing.lg,
    },
    checkedInTitle: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
    },
    checkedInSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    // Camera overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    cameraHeader: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    // Scanner area
    scannerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: Colors.success,
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 12,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 12,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 12,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 12,
    },
    scanText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
        marginTop: Spacing.xxl,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    // Result
    resultContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: Spacing.xxl,
    },
    resultCard: {
        width: '100%',
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxxl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    resultText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryBtn: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginTop: Spacing.md,
    },
    retryBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
        borderRadius: BorderRadius.lg,
    },
    retryBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    doneBtn: {
        marginTop: Spacing.sm,
        paddingVertical: 10,
    },
    doneBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
