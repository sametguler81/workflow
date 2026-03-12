export type CurrencyCode = 'TRY' | 'USD' | 'EUR';

export interface ExchangeRates {
    EUR_TRY: number;
    USD_TRY: number;
}

// We can still cache the current day rates, but for historical dates, it's better to fetch on demand or cache by date.
// Let's use a simple map for caching by date to avoid repeated API calls.
const ratesCache = new Map<string, { rates: ExchangeRates; timestamp: number }>();
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

/**
 * Format date string to YYYY-MM-DD for Frankfurter API.
 * Accepts YYYY-MM-DD or DD.MM.YYYY.
 */
function formatForApi(dateStr?: string): string {
    if (!dateStr) return 'latest';
    
    // Check if it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    
    // Convert DD.MM.YYYY to YYYY-MM-DD
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return 'latest';
}

/**
 * Fetches current or historical exchange rates for EUR and USD to TRY using the free Frankfurter API.
 */
export async function getExchangeRates(date?: string): Promise<ExchangeRates> {
    const apiDate = formatForApi(date);
    const now = Date.now();
    
    const cached = ratesCache.get(apiDate);
    if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
        return cached.rates;
    }

    try {
        const response = await fetch(`https://api.frankfurter.app/${apiDate}?to=TRY,USD`);
        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }
        const data = await response.json();

        // Frankfurter uses EUR as base default. 
        // data.rates.TRY = 1 EUR in TRY
        // data.rates.USD = 1 EUR in USD
        const eurToTry = data.rates.TRY;
        const eurToUsd = data.rates.USD;
        
        // Calculate USD to TRY via Cross Rate: (EUR/TRY) / (EUR/USD)
        const usdToTry = eurToTry / eurToUsd;

        const newRates = {
            EUR_TRY: eurToTry,
            USD_TRY: usdToTry,
        };
        
        ratesCache.set(apiDate, { rates: newRates, timestamp: now });

        return newRates;
    } catch (error) {
        console.error(`Döviz kurları alınamadı (${apiDate}), varsayılan kurlar kullanılacak:`, error);
        // Fallback rates roughly mapping to current real-world values just in case API fails
        return {
            EUR_TRY: 38.0,
            USD_TRY: 34.0,
        };
    }
}

/**
 * Converts a given amount from its currency to TRY based on current or historical rates.
 */
export async function convertToTRY(amount: number, currency: CurrencyCode, date?: string): Promise<{ amountInTRY: number, exchangeRate: number }> {
    if (currency === 'TRY' || !currency) {
        return { amountInTRY: amount, exchangeRate: 1 };
    }

    const rates = await getExchangeRates(date);
    
    if (currency === 'USD') {
        return { amountInTRY: amount * rates.USD_TRY, exchangeRate: rates.USD_TRY };
    }
    if (currency === 'EUR') {
        return { amountInTRY: amount * rates.EUR_TRY, exchangeRate: rates.EUR_TRY };
    }

    return { amountInTRY: amount, exchangeRate: 1 }; // Fallback
}
