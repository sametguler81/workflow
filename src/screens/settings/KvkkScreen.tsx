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

interface KvkkScreenProps {
    onBack: () => void;
}

export function KvkkScreen({ onBack }: KvkkScreenProps) {
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
                <Text style={styles.headerTitle}>KVKK Aydınlatma Metni</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
                    Son Güncelleme: 19 Şubat 2026
                </Text>

                <Section title="1. Veri Sorumlusunun Kimliği" colors={colors}>
                    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, muhatap olunan şirketlerin kullanıcıları olarak sizlerin ("Veri Sahibi") paylaştığı tüm kişisel veriler, tarafımızca ("WorkFlow360") belirli çerçevelerde, veri sorumlusu sıfatıyla işlenmektedir.
                </Section>

                <Section title="2. Kişisel Verilerin İşlenme Amacı" colors={colors}>
                    Toplanan kişisel verileriniz (Ad, Soyad, E-Posta Adresi, IP adresi, Konum, Görsel/Medya dosyaları);
                    {'\n'}• Platform üzerindeki İnsan Kaynakları (İzin, Yoklama) ve Finansal (Masraf, Fiş) işlemlerinin tarafınızca yapılabilmesi,
                    {'\n'}• İşveren ile çalışan arasındaki iç iletişimin sağlanması,
                    {'\n'}• Sistem güvenliğinin sağlanması ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.
                </Section>

                <Section title="3. İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği" colors={colors}>
                    Uygulamamızın altyapısını sağlamak amacı ile verileriniz yurt dışı menşeili (Google Firebase vb.) güvenli sunuculara aktarılmaktadır. Zira cloud(bulut) tabanlı bu mimariler, sistemin anlık çalışabilmesi için şarttır. Uygulamaya kayıt olarak rızanız doğrultusunda bu yurt dışı veri aktarımına ve depolanmasına açık rıza vermiş olursunuz.
                    Ayrıca yasal bir talep geldiği takdirde resmi makamlarla da kanuni zorunluluk gereği paylaşım yapılabilmektedir.
                </Section>

                <Section title="4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi" colors={colors}>
                    Verileriniz, uygulamanın arayüzüne (uygulama içine) girdiğiniz formlar ve cihaz onayları(izinleri) vasıtası ile toplanır. Bu veri işleme süreçleri "Sözleşmenin İfası", "Veri Sorumlusunun Hukuki Yükümlülüğü" ve uygulamanın dış sunucu kullanan mimarisi sebebiyle "Geçerli Açık Rıza" hukuki sebeplerine dayanmaktadır.
                </Section>

                <Section title="5. Veri Sahibinin Hakları" colors={colors}>
                    KVKK'nın 11. maddesi uyarınca veri sahipleri:
                    {'\n'}• Verilerinin işlenip işlenmediğini öğrenme,
                    {'\n'}• İşlenmişse buna ilişkin bilgi talep etme,
                    {'\n'}• İşlenme amacına uygun kullanılıp kullanılmadığını öğrenme,
                    {'\n'}• Yurt içi/yurt dışı aktarıldığı 3. kişileri bilme,
                    {'\n'}• Eksik veya yanlış işlenmişse düzeltilmesini isteme,
                    {'\n'}• KVKK'da yer alan şartlar çerçevesinde silinmesini isteme haklarına sahiptir.
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
