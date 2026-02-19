import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { ModernStatCard } from '../../components/ModernStatCard';
import { getCompanyInvoices, Invoice, DOCUMENT_TYPE_LABELS } from '../../services/invoiceService';
import { getCompanyExpenses, Expense } from '../../services/expenseService';

interface FinanceScreenProps {
    onBack: () => void;
    onNavigateCreateInvoice: (type: 'income' | 'expense') => void;
    onNavigateInvoiceDetail: (id: string) => void;
    onNavigateExpenseDetail: (id: string) => void;
}

export function FinanceScreen({ onBack, onNavigateCreateInvoice, onNavigateInvoiceDetail, onNavigateExpenseDetail }: FinanceScreenProps) {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [netBalance, setNetBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [reimbursing, setReimbursing] = useState<string | null>(null);
    const [debts, setDebts] = useState<any[]>([]);

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
        return new Date(dateStr);
    };

    const loadData = useCallback(async () => {
        if (!profile?.companyId) return;
        try {
            const [invoicesRes, expensesRes] = await Promise.all([
                getCompanyInvoices(profile.companyId, 100),
                getCompanyExpenses(profile.companyId, 100)
            ]);

            // 1. Calculate Income (Invoices with direction='income')
            const income = invoicesRes.data
                .filter(i => i.direction === 'income' && i.status === 'approved')
                .reduce((sum, item) => sum + Number(item.amount), 0);

            // 2. Calculate Company Direct Expenses (Invoices with direction='expense')
            const invoiceExpense = invoicesRes.data
                .filter(i => i.direction === 'expense' && i.status === 'approved')
                .reduce((sum, item) => sum + Number(item.amount), 0);

            // 3. Calculate Personnel Expenses
            const approvedExpenses = expensesRes.data.filter(e => e.status === 'approved');

            const companyCardExpenses = approvedExpenses
                .filter(e => e.paymentMethod === 'company_card')
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const personalExpenses = approvedExpenses
                .filter(e => e.paymentMethod === 'personal')
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);

            const reimbursedPersonalExpenses = approvedExpenses
                .filter(e => e.paymentMethod === 'personal' && e.isReimbursed)
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);

            // Net Kasa = Income - (InvoiceExpense + CompanyCardExpense + ReimbursedPersonalExpenses)
            const cashOutflow = invoiceExpense + companyCardExpenses + reimbursedPersonalExpenses;

            // Total recorded expense (including pending reimbursements)
            const totalRecordedExpense = invoiceExpense + companyCardExpenses + personalExpenses;

            setTotalIncome(income);
            setTotalExpense(totalRecordedExpense); // Use total recorded for display
            setNetBalance(income - cashOutflow);

            // Calculate Debts
            const debtMap: Record<string, { userId: string; userName: string; amount: number; count: number }> = {};

            // Only count approved & unpaid personal expenses
            expensesRes.data
                .filter(e => e.status === 'approved' && e.paymentMethod === 'personal' && !e.isReimbursed)
                .forEach(e => {
                    if (!debtMap[e.userId]) {
                        debtMap[e.userId] = { userId: e.userId, userName: e.userName, amount: 0, count: 0 };
                    }
                    debtMap[e.userId].amount += e.amount;
                    debtMap[e.userId].count += 1;
                });

            setDebts(Object.values(debtMap));

            // Transactions List
            const combined = [
                ...invoicesRes.data.map(i => ({
                    ...i,
                    type: i.direction === 'income' ? 'income' : 'expense',
                    source: 'invoice',
                    documentTypeDisplay: DOCUMENT_TYPE_LABELS[i.documentType] || 'Belge'
                })),
                ...expensesRes.data.map(e => ({
                    ...e,
                    type: 'expense',
                    source: 'personnel',
                    direction: 'expense',
                    isPersonal: e.paymentMethod === 'personal',
                    paymentMethodDisplay: e.paymentMethod === 'company_card' ? 'Şirket Kartı' : 'Nakit/Cep'
                }))
            ].sort((a, b) => {
                const dateA = a.date ? parseDate(a.date).getTime() : new Date(a.createdAt).getTime();
                const dateB = b.date ? parseDate(b.date).getTime() : new Date(b.createdAt).getTime();
                return dateB - dateA;
            }).slice(0, 10);

            setRecentTransactions(combined);

        } catch (error) {
            console.error('Finance load error:', error);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleReimburse = async (userId: string, userName: string, amount: number) => {
        if (reimbursing) return;

        const confirm = Platform.OS === 'web' ? window.confirm(`${userName} kullanıcısının ${formatCurrency(amount)} ödemesi yapıldı mı?`) : true;

        if (!confirm) return;

        setReimbursing(userId);
        try {
            const userExpenses = (await getCompanyExpenses(profile?.companyId || '', 100)).data
                .filter(e => e.userId === userId && e.status === 'approved' && e.paymentMethod === 'personal' && !e.isReimbursed);

            const { markExpenseAsReimbursed } = await import('../../services/expenseService');
            await Promise.all(userExpenses.map(e => markExpenseAsReimbursed(e.id)));

            await loadData();
            alert('Ödeme başarıyla kaydedildi.');
        } catch (error) {
            console.error(error);
            alert('İşlem başarısız.');
        } finally {
            setReimbursing(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const handleTransactionPress = (item: any) => {
        if (item.source === 'invoice') {
            onNavigateInvoiceDetail(item.id);
        } else if (item.source === 'personnel' || item.type === 'expense') {
            onNavigateExpenseDetail(item.id);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Ön Muhasebe</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                contentContainerStyle={styles.content}
            >
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '30' }]}>
                        <View style={[styles.iconBox, { backgroundColor: Colors.success }]}>
                            <Ionicons name="arrow-down-outline" size={20} color="#FFF" />
                        </View>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Gelir</Text>
                        <Text style={[styles.statValue, { color: Colors.success }]}>{formatCurrency(totalIncome)}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: Colors.danger + '15', borderColor: Colors.danger + '30' }]}>
                        <View style={[styles.iconBox, { backgroundColor: Colors.danger }]}>
                            <Ionicons name="arrow-up-outline" size={20} color="#FFF" />
                        </View>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Gider</Text>
                        <Text style={[styles.statValue, { color: Colors.danger }]}>{formatCurrency(totalExpense)}</Text>
                    </View>
                </View>

                {/* Net Balance */}
                <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Net Kasa Durumu</Text>
                    <Text style={[styles.balanceValue, { color: netBalance >= 0 ? Colors.success : Colors.danger }]}>
                        {formatCurrency(netBalance)}
                    </Text>
                </View>

                {/* Personnel Debts Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Personel Borçları</Text>
                <View style={[styles.debtCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    {debts.length === 0 && (
                        <Text style={{ textAlign: 'center', color: colors.textTertiary, padding: 20 }}>Ödenecek borç bulunmuyor.</Text>
                    )}
                    {debts.map((debt) => (
                        <View key={debt.userId} style={[styles.debtRow, { borderBottomColor: colors.borderLight }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.debtName, { color: colors.text }]}>{debt.userName}</Text>
                                <Text style={[styles.debtCount, { color: colors.textTertiary }]}>{debt.count} adet fiş</Text>
                            </View>
                            <Text style={[styles.debtAmount, { color: Colors.danger }]}>{formatCurrency(debt.amount)}</Text>
                            <TouchableOpacity
                                style={[styles.payBtn, { backgroundColor: Colors.success }]}
                                onPress={() => handleReimburse(debt.userId, debt.userName, debt.amount)}
                                disabled={!!reimbursing}
                            >
                                {reimbursing === debt.userId ? (
                                    <View style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#FFF', borderRadius: 8 }} />
                                ) : (
                                    <Text style={styles.payBtnText}>Öde</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Hızlı İşlem</Text>
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                        onPress={() => onNavigateCreateInvoice('income')}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                        <Text style={styles.actionBtnText}>Gelir Ekle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
                        onPress={() => onNavigateCreateInvoice('expense')}
                    >
                        <Ionicons name="remove" size={24} color="#FFF" />
                        <Text style={styles.actionBtnText}>Gider Ekle</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Transactions */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Son Hareketler</Text>
                {recentTransactions.map((item, index) => {
                    const isIncome = item.direction === 'income';
                    const isPersonnel = item.source === 'personnel';

                    // Icon & Color Logic
                    let iconName = 'help-outline';
                    let iconColor = colors.text;
                    let bgColor = colors.border;
                    let typeLabel = '';

                    if (item.source === 'invoice') {
                        // Invoice / Document
                        typeLabel = item.documentTypeDisplay || 'Fatura';
                        if (isIncome) {
                            iconName = 'document-text-outline';
                            iconColor = Colors.success;
                            bgColor = Colors.success + '20';
                        } else {
                            iconName = 'document-text-outline';
                            iconColor = Colors.danger;
                            bgColor = Colors.danger + '20';
                        }
                    } else if (isPersonnel) {
                        // Personnel Receipt
                        typeLabel = 'Fiş / ' + (item.paymentMethodDisplay || 'Harcama');
                        if (item.isPersonal && !item.isReimbursed) {
                            iconName = 'wallet-outline';
                            iconColor = Colors.warning;
                            bgColor = Colors.warning + '20';
                        } else if (item.paymentMethod === 'company_card') {
                            iconName = 'card-outline';
                            iconColor = Colors.danger;
                            bgColor = Colors.danger + '20';
                        } else {
                            // Reimbursed Personal
                            iconName = 'checkmark-circle-outline';
                            iconColor = Colors.success;
                            bgColor = Colors.success + '20';
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={item.id || index}
                            style={[styles.transactionItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                            onPress={() => handleTransactionPress(item)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.transIcon, { backgroundColor: bgColor }]}>
                                <Ionicons name={iconName as any} size={20} color={iconColor} />
                            </View>
                            <View style={styles.transInfo}>
                                <Text style={[styles.transTitle, { color: colors.text }]}>
                                    {item.description || item.category || 'İşlem'}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <View style={[styles.badge, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderLight }]}>
                                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{typeLabel}</Text>
                                    </View>
                                    <Text style={[styles.transDate, { color: colors.textSecondary }]}>
                                        {item.date ? parseDate(item.date).toLocaleDateString('tr-TR') : parseDate(item.createdAt).toLocaleDateString('tr-TR')}
                                    </Text>
                                </View>
                                <Text style={[styles.transSub, { color: colors.textTertiary }]}>{item.userName}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                <Text style={[styles.transAmount, {
                                    color: isIncome ? Colors.success : Colors.danger
                                }]}>
                                    {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                                </Text>
                                {isPersonnel && item.isPersonal && !item.isReimbursed && (
                                    <Text style={{ fontSize: 10, color: Colors.warning, fontWeight: '700' }}>(Ödenmedi)</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {recentTransactions.length === 0 && (
                    <Text style={{ textAlign: 'center', color: colors.textTertiary, marginTop: 20 }}>Henüz işlem yok.</Text>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { padding: Spacing.lg },
    statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
    statCard: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    iconBox: {
        width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm
    },
    statLabel: { fontSize: 12, fontWeight: '600' },
    statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
    balanceCard: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: Spacing.xl,
        ...Shadows.small,
    },
    balanceLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    balanceValue: { fontSize: 32, fontWeight: '800' },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.md },
    actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: 8,
        ...Shadows.small,
    },
    actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    transIcon: {
        width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md
    },
    transInfo: { flex: 1 },
    transTitle: { fontSize: 14, fontWeight: '600' },
    transDate: { fontSize: 12 },
    transSub: { fontSize: 11, marginTop: 2 },
    transAmount: { fontSize: 15, fontWeight: '700' },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, fontWeight: '600' },
    debtCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
    },
    debtRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    debtName: { fontSize: 14, fontWeight: '600' },
    debtCount: { fontSize: 12, marginTop: 2 },
    debtAmount: { fontSize: 15, fontWeight: '700', marginRight: Spacing.md },
    payBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    payBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
