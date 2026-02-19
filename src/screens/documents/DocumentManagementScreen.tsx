import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, Shadows } from '../../theme/theme';
import { InvoiceListScreen } from '../invoice/InvoiceListScreen';
import { ExpenseListScreen } from '../expense/ExpenseListScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DocumentManagementScreenProps {
    navigation: any;
}

type TabType = 'invoices' | 'expenses';

export function DocumentManagementScreen({ navigation }: DocumentManagementScreenProps) {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('invoices');
    const insets = useSafeAreaInsets();

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight, paddingTop: insets.top + Spacing.md }]}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Belge Yönetimi</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Custom Segmented Control */}
            <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'invoices' && { backgroundColor: colors.surface, ...Shadows.small },
                    ]}
                    onPress={() => setActiveTab('invoices')}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="receipt-outline"
                        size={18}
                        color={activeTab === 'invoices' ? Colors.primary : colors.textTertiary}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            {
                                color: activeTab === 'invoices' ? colors.text : colors.textTertiary,
                                fontWeight: activeTab === 'invoices' ? '600' : '500',
                            },
                        ]}
                    >
                        Faturalar
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'expenses' && { backgroundColor: colors.surface, ...Shadows.small },
                    ]}
                    onPress={() => setActiveTab('expenses')}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="wallet-outline"
                        size={18}
                        color={activeTab === 'expenses' ? Colors.secondary : colors.textTertiary}
                    />
                    <Text
                        style={[
                            styles.tabText,
                            {
                                color: activeTab === 'expenses' ? colors.text : colors.textTertiary,
                                fontWeight: activeTab === 'expenses' ? '600' : '500',
                            },
                        ]}
                    >
                        Fişler
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}

            <View style={styles.content}>
                {activeTab === 'invoices' ? (
                    <InvoiceListScreen
                        onNavigateDetail={(id) => navigation.navigate('InvoiceDetail', { invoiceId: id })}
                        onNavigateCreate={() => navigation.navigate('InvoiceUpload')}
                        onBack={() => { }} // No back action needed inside tab
                        showHeader={false}
                    />
                ) : (
                    <ExpenseListScreen
                        onNavigateDetail={(id) => navigation.navigate('ExpenseDetail', { expenseId: id })}
                        onNavigateCreate={() => navigation.navigate('ExpenseUpload')}
                        onBack={() => { }} // No back action needed inside tab
                        showHeader={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        height: 44,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        gap: 6,
    },
    tabText: {
        fontSize: 13,
    },
    content: {
        flex: 1,
    },
});
