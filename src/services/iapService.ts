/**
 * IAP Servis Modülü
 * 
 * Uygulama içi satın alma (In-App Purchase) işlemlerini yönetir.
 * expo-iap kütüphanesi ile Apple App Store ve Google Play Store
 * üzerinden abonelik satın alma, doğrulama ve geri yükleme işlemlerini sağlar.
 * 
 * ⚠️ ÖNEMLİ: Bu servis sadece altyapıyı hazırlar.
 * Gerçek ödeme almak için:
 * 1. Apple Developer / Google Play Developer hesapları açılmalı
 * 2. Store'larda abonelik ürünleri tanımlanmalı
 * 3. Firebase Cloud Functions deploy edilmeli
 */

import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { IAP_PRODUCT_IDS, ALL_SUBSCRIPTION_SKUS, PRODUCT_TO_PLAN } from '../config/iapConfig';

// ─── Types ─────────────────────────────────────────────

export interface SubscriptionProduct {
    id: string;
    title: string;
    description: string;
    price: string;
    currency: string;
    localizedPrice: string;
    plan: 'pro' | 'enterprise';
    period: 'monthly' | 'yearly';
}

export interface PurchaseResult {
    success: boolean;
    plan?: 'pro' | 'enterprise';
    period?: 'monthly' | 'yearly';
    error?: string;
}

export interface ReceiptValidationResult {
    valid: boolean;
    plan?: string;
    expiresAt?: string;
    error?: string;
}

// ─── Receipt Validation (Server-Side via onCall) ───────

/**
 * Receipt'i Firebase Cloud Function üzerinden doğrular.
 * 
 * ✅ Güvenlik:
 * - onCall kullanır, Firebase Auth otomatik olarak gönderilir
 * - companyId sunucu tarafında kullanıcı profilinden alınır
 * - Sadece admin/superadmin plan değiştirebilir (sunucu kontrolü)
 * 
 * @param receipt - Store'dan alınan receipt/token
 * @param productId - Satın alınan ürün ID'si
 * @param platform - 'ios' veya 'android'
 */
export async function validateReceipt(
    receipt: string,
    productId: string,
    platform: 'ios' | 'android'
): Promise<ReceiptValidationResult> {
    try {
        const functions = getFunctions();
        const validateReceiptFn = httpsCallable(functions, 'validateReceipt');

        const result = await validateReceiptFn({
            receipt,
            productId,
            platform,
        });

        return result.data as ReceiptValidationResult;
    } catch (error: any) {
        console.error('Receipt validation error:', error);
        return {
            valid: false,
            error: error.message || 'Receipt doğrulama başarısız',
        };
    }
}

// ─── Subscription Status (Read-only) ──────────────────

/**
 * Firmanın aktif abonelik durumunu kontrol eder.
 * ✅ Sadece okuma — Firestore kuralları ile korunur.
 */
export async function getSubscriptionStatus(companyId: string): Promise<{
    plan: string;
    billingPeriod?: string;
    expiresAt?: string;
    isActive: boolean;
}> {
    try {
        const doc = await firestore().collection('companies').doc(companyId).get();
        const data = doc.data();

        if (!data) {
            return { plan: 'free', isActive: true };
        }

        const plan = data.plan || 'free';
        const expiresAt = data.subscriptionExpiresAt;
        const isActive = plan === 'free' || !expiresAt || new Date(expiresAt) > new Date();

        return {
            plan,
            billingPeriod: data.billingPeriod,
            expiresAt,
            isActive,
        };
    } catch (error) {
        console.error('Subscription status check error:', error);
        return { plan: 'free', isActive: true };
    }
}

// ─── Utilities ─────────────────────────────────────────

/**
 * Product ID'den plan bilgisini döner
 */
export function getPlanFromProductId(productId: string): { plan: 'pro' | 'enterprise'; period: 'monthly' | 'yearly' } | null {
    return PRODUCT_TO_PLAN[productId] || null;
}

/**
 * Seçilen plan ve periyoda göre product ID döner
 */
export function getProductId(plan: 'pro' | 'enterprise', period: 'monthly' | 'yearly'): string {
    const key = `${plan.toUpperCase()}_${period.toUpperCase()}` as keyof typeof IAP_PRODUCT_IDS;
    return IAP_PRODUCT_IDS[key];
}

/**
 * Platformu döner
 */
export function getCurrentPlatform(): 'ios' | 'android' {
    return Platform.OS as 'ios' | 'android';
}

// Re-export config
export { IAP_PRODUCT_IDS, ALL_SUBSCRIPTION_SKUS } from '../config/iapConfig';
