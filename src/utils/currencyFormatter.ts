/**
 * Formats a raw number string into Turkish currency format naturally.
 * Example: User types "1" -> "1"
 * User types "1234" -> "1.234"
 * User types "12345,6" -> "12.345,6"
 * User types "12345,66" -> "12.345,66"
 */
export const formatCurrencyInput = (text: string): string => {
    if (!text) return '';

    // Remove any character that is not a digit or comma
    let cleaned = text.replace(/[^0-9,]/g, '');

    // If string starts with a comma, prepend a zero
    if (cleaned.startsWith(',')) {
        cleaned = '0' + cleaned;
    }

    // Allow only one comma. If there are multiple, keep only the first one.
    const parts = cleaned.split(',');
    if (parts.length > 2) {
        cleaned = parts[0] + ',' + parts.slice(1).join('');
    }

    let [integerPart, decimalPart] = cleaned.split(',');

    // Handle integer part
    if (integerPart) {
        // Remove leading zeros safely unless it's just "0"
        integerPart = integerPart.replace(/^0+(?=\d)/, '');
        // Add thousands separator (dot)
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // If there is a comma, attach the decimal part limited to 2 digits
    if (decimalPart !== undefined) {
        const truncatedDecimal = decimalPart.substring(0, 2);
        return `${integerPart},${truncatedDecimal}`;
    }

    return integerPart || '';
};

/**
 * Parses a Turkish currency string back into a standard Float number for database storage.
 * Example: "123.456,78" becomes 123456.78
 */
export const parseCurrencyToFloat = (text: string): number => {
    if (!text) return 0;

    // Remove all dots (thousands separators)
    let cleaned = text.replace(/\./g, '');

    // Replace comma with dot (decimal separator)
    cleaned = cleaned.replace(/,/g, '.');

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};
