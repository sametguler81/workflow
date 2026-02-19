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
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../theme/theme';

interface PrivacyPolicyScreenProps {
    onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#1e293b', '#0f172a'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
                    Son Güncelleme: 19 Şubat 2026
                </Text>

                <Section title="1. Giriş" colors={colors}>
                    WorkFlow360 ("biz", "bizim" veya "Uygulama") olarak, gizliliğinize önem veriyoruz. Bu Gizlilik Politikası, uygulamamızı kullandığınızda bilgilerinizin nasıl toplandığını, kullanıldığını ve paylaşıldığını açıklar.
                </Section>

                <Section title="2. Topladığımız Bilgiler" colors={colors}>
                    Uygulamayı kullanırken aşağıdaki bilgileri toplayabiliriz:
                    {'\n\n'}
                    • **Hesap Bilgileri:** Adınız, e-posta adresiniz, şirket adınız ve profil fotoğrafınız.
                    {'\n'}
                    • **Kullanım Verileri:** İzin talepleri, masraf fişleri ve yoklama verileri gibi uygulama içi işlemleriniz.
                    {'\n'}
                    • **Cihaz Bilgileri:** Cihaz modeli, işletim sistemi sürümü ve benzersiz cihaz tanımlayıcıları (bildirimler için).
                    {'\n'}
                    • **Kamera Erişimi:** Profil fotoğrafı yüklemek, fiş taramak veya QR kod okutmak için kamera izni istendiğinde.
                </Section>

                <Section title="3. Bilgilerin Kullanımı" colors={colors}>
                    Topladığımız bilgileri şu amaçlarla kullanırız:
                    {'\n\n'}
                    • Hizmetlerimizi sağlamak ve yönetmek.
                    {'\n'}
                    • Hesabınızı oluşturmak ve güvenliğini sağlamak.
                    {'\n'}
                    • Size bildirimler (onay durumu, duyurular vb.) göndermek.
                    {'\n'}
                    • Uygulama performansını analiz etmek ve iyileştirmek.
                </Section>

                <Section title="4. Bilgilerin Paylaşımı" colors={colors}>
                    Kişisel verilerinizi asla üçüncü taraflara satmayız. Bilgilerinizi yalnızca şu durumlarda paylaşabiliriz:
                    {'\n\n'}
                    • **Yasal Zorunluluklar:** Kanunen gerekli olduğunda veya yasal süreçlere uymak için.
                    {'\n'}
                    • **Hizmet Sağlayıcılar:** Veri depolama ve sunucu hizmetleri gibi altyapı sağlayıcılarımızla (örn. Google Firebase).
                </Section>

                <Section title="5. Veri Güvenliği" colors={colors}>
                    Verileriniz endüstri standardı güvenlik önlemleriyle (SSL şifreleme, güvenli sunucular) korunmaktadır. Ancak, internet üzerinden yapılan hiçbir veri iletiminin %100 güvenli olduğunu garanti edemeyiz.
                </Section>

                <Section title="6. Kullanıcı Hakları" colors={colors}>
                    Hesabınızı ve verilerinizi silme hakkına sahipsiniz. Hesabınızı silmek isterseniz, Ayarlar menüsünden "Hesabımı Sil" seçeneğini kullanabilir veya bizimle iletişime geçebilirsiniz.
                </Section>

                <Section title="7. İletişim" colors={colors}>
                    Bu Gizlilik Politikası hakkında sorularınız varsa, lütfen bizimle iletişime geçin:
                    {'\n\n'}
                    E-posta: support@workflow360.app
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function Section({ title, children, colors }: any) {
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                {children}
            </Text>
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
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    content: {
        padding: Spacing.xl,
        paddingTop: 30,
    },
    lastUpdated: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: Spacing.sm,
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 22,
    },
});
