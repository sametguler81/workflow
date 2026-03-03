/**
 * IAP Yapılandırma Dosyası
 * 
 * Bu dosya App Store ve Google Play'deki ürün ID'lerini içerir.
 * Developer hesapları açıldıktan sonra ürünler Store'larda tanımlanmalı
 * ve buradaki ID'ler Store'daki ID'lerle eşleşmelidir.
 * 
 * ⚠️ ÖNEMLİ: Aşağıdaki Product ID'ler placeholder'dır.
 * App Store Connect ve Google Play Console'da ürünler oluşturulduktan sonra
 * buraya gerçek ID'ler girilmelidir.
 */

/**
 * IAP Aktif/Pasif Anahtarı
 * 
 * Developer hesapları ve Store ürünleri hazır olduğunda bunu `true` yap.
 * `false` olduğunda IAP sistemi tamamen devre dışı kalır (hata vermez).
 */
export const IAP_ENABLED = false;

// Bundle ID: com.sametguler.workflow
const BUNDLE_PREFIX = 'com.sametguler.workflow';

/**
 * Abonelik ürün ID'leri
 * App Store Connect ve Google Play Console'da bu ID'lerle ürün oluşturulmalı
 */
export const IAP_PRODUCT_IDS = {
    PRO_MONTHLY: `${BUNDLE_PREFIX}.pro.monthly`,
    PRO_YEARLY: `${BUNDLE_PREFIX}.pro.yearly`,
    ENTERPRISE_MONTHLY: `${BUNDLE_PREFIX}.enterprise.monthly`,
    ENTERPRISE_YEARLY: `${BUNDLE_PREFIX}.enterprise.yearly`,
} as const;

/** Tüm abonelik SKU'ları (Store'dan ürün çekmek için) */
export const ALL_SUBSCRIPTION_SKUS = Object.values(IAP_PRODUCT_IDS);

/** Product ID → Plan eşleşmesi */
export const PRODUCT_TO_PLAN: Record<string, { plan: 'pro' | 'enterprise'; period: 'monthly' | 'yearly' }> = {
    [IAP_PRODUCT_IDS.PRO_MONTHLY]: { plan: 'pro', period: 'monthly' },
    [IAP_PRODUCT_IDS.PRO_YEARLY]: { plan: 'pro', period: 'yearly' },
    [IAP_PRODUCT_IDS.ENTERPRISE_MONTHLY]: { plan: 'enterprise', period: 'monthly' },
    [IAP_PRODUCT_IDS.ENTERPRISE_YEARLY]: { plan: 'enterprise', period: 'yearly' },
};

export type IAPProductId = typeof IAP_PRODUCT_IDS[keyof typeof IAP_PRODUCT_IDS];
