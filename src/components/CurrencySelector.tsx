import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BorderRadius, Colors, Spacing } from '../theme/theme';
import { CurrencyCode } from '../services/currencyService';

interface CurrencySelectorProps {
    value: CurrencyCode;
    onChange: (currency: CurrencyCode) => void;
}

const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'TRY', label: 'TL', symbol: '₺' },
    { code: 'USD', label: 'USD', symbol: '$' },
    { code: 'EUR', label: 'EUR', symbol: '€' },
];

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Para Birimi</Text>
            <View style={[styles.row, { borderColor: colors.borderLight }]}>
                {currencies.map((currency, index) => {
                    const isSelected = value === currency.code;
                    return (
                        <TouchableOpacity
                            key={currency.code}
                            style={[
                                styles.option,
                                {
                                    backgroundColor: isSelected ? Colors.primary : 'transparent',
                                    borderRightWidth: index < currencies.length - 1 ? 1 : 0,
                                    borderRightColor: colors.borderLight,
                                },
                            ]}
                            onPress={() => onChange(currency.code)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    { color: isSelected ? '#FFF' : colors.text },
                                ]}
                            >
                                {currency.symbol} {currency.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        letterSpacing: 0.3,
    },
    row: {
        flexDirection: 'row',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    option: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
