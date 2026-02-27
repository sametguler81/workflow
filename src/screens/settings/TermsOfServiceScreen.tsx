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
import { Colors, Spacing } from '../../theme/theme';

interface TermsOfServiceScreenProps {
    onBack: () => void;
}

export function TermsOfServiceScreen({ onBack }: TermsOfServiceScreenProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={['#1e293b', '#0f172a'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kullanıcı Sözleşmesi</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
                    Son Güncelleme: 19 Şubat 2026
                </Text>

                <Section title="1. Taraflar" colors={colors}>
                    İşbu Sözleşme, WorkFlow360 uygulamasını ("Uygulama") kullanan tüm kullanıcılar ve firma sahipleri ("Kullanıcı") ile uygulamanın yasal sahibi ("Hizmet Sağlayıcı") arasında akdedilmiştir. Uygulamaya kayıt olarak bu sözleşmeyi kabul etmiş sayılırsınız.
                </Section>

                <Section title="2. Hizmetin Kapsamı" colors={colors}>
                    Uygulama, kurumsal firmaların insan kaynakları, masraf, fiş, zimmet ve yoklama süreçlerini dijital ortamda yönetmesini sağlayan bir platformdur. Hizmet Sağlayıcı, uygulamanın kesintisiz çalışması için makul çabayı göstereceğini taahhüt eder ancak %100 kesintisizlik garantisi vermez.
                </Section>

                <Section title="3. Kullanıcı Yükümlülükleri" colors={colors}>
                    • Kullanıcı, uygulamaya girmiş olduğu tüm verilerin doğruluğundan sorumludur.
                    {'\n'}• Kullanıcı, uygulamayı yasa dışı, ahlaka aykırı veya üçüncü şahısların haklarını ihlal edecek şekilde kullanamaz.
                    {'\n'}• Şifre güvenliği tamamen kullanıcının sorumluluğundadır. İlgili hesabın başkası tarafından kullanılması durumunda doğacak zararlardan Hizmet Sağlayıcı sorumlu tutulamaz.
                </Section>

                <Section title="4. Lisans ve Fikri Mülkiyet" colors={colors}>
                    Uygulamanın tüm kaynak kodları, veri tabanı, tasarımı ve dokümantasyonuna ilişkin fikri mülkiyet hakları Hizmet Sağlayıcı'ya aittir. Abonelik (ücretsiz veya ücretli) devredilemez, satılamaz.
                </Section>

                <Section title="5. Ücretlendirme ve Abonelik" colors={colors}>
                    Seçilen plan dahilindeki ücretler ve kısıtlamalar ("UserLimit" vb.) kayıt ekranında ve Ayarlar bölümünde açıkça belirtilmektedir. İade koşulları ve iptal süreçleri Apple App Store ve Google Play Store kurallarına göre işler.
                </Section>

                <Section title="6. Sorumluluk Reddi" colors={colors}>
                    Hizmet Sağlayıcı, kullanıcının veri kaybından, kâr kaybından veya uygulamanın kullanımından doğabilecek dolaylı hiçbir hukuki veya maddi zarardan sorumlu tutulamaz. Uygulama veritabanında saklanan finansal dokümanların ve fişlerin fiziksel orijinallerini saklamak tamamen kullanıcının ve şirketin yasal yükümlülüğüdür.
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
