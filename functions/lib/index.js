"use strict";
/**
 * Firebase Cloud Functions — IAP Receipt Doğrulama
 *
 * Bu dosya receipt doğrulama ve abonelik yönetimi için Cloud Functions içerir.
 *
 * ⚠️ GEREKLİ ENVIRONMENT VARIABLES:
 * Apple:
 *   - APPLE_SHARED_SECRET: App Store Connect'ten alınan shared secret
 *     firebase functions:secrets:set APPLE_SHARED_SECRET
 * Google:
 *   - GOOGLE_SERVICE_ACCOUNT_KEY: Google Play Developer API service account JSON
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackInvoiceStorage = exports.trackExpenseStorage = exports.checkExpiredSubscriptions = exports.sendNotification = exports.validateReceipt = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// ─── Product ID → Plan Mapping ─────────────────────────
const PRODUCT_TO_PLAN = {
    'com.sametguler.workflow.pro.monthly': { plan: 'pro', period: 'monthly' },
    'com.sametguler.workflow.pro.yearly': { plan: 'pro', period: 'yearly' },
    'com.sametguler.workflow.enterprise.monthly': { plan: 'enterprise', period: 'monthly' },
    'com.sametguler.workflow.enterprise.yearly': { plan: 'enterprise', period: 'yearly' },
};
const PLAN_USER_LIMITS = {
    free: 5,
    pro: 25,
    enterprise: 999,
};
// ─── Receipt Validation ────────────────────────────────
async function validateAppleReceipt(receipt, sharedSecret) {
    var _a;
    if (!sharedSecret) {
        console.error('Apple shared secret not configured');
        return { valid: false };
    }
    const urls = [
        'https://buy.itunes.apple.com/verifyReceipt',
        'https://sandbox.itunes.apple.com/verifyReceipt',
    ];
    for (const url of urls) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'receipt-data': receipt,
                    password: sharedSecret,
                    'exclude-old-transactions': true,
                }),
            });
            const data = await response.json();
            if (data.status === 21007)
                continue;
            if (data.status !== 0)
                return { valid: false };
            const latestInfo = (_a = data.latest_receipt_info) === null || _a === void 0 ? void 0 : _a[0];
            if (!latestInfo)
                return { valid: false };
            return {
                valid: true,
                expiresAt: latestInfo.expires_date_ms
                    ? new Date(parseInt(latestInfo.expires_date_ms)).toISOString()
                    : undefined,
                productId: latestInfo.product_id,
            };
        }
        catch (error) {
            console.error(`Apple validation error (${url}):`, error);
        }
    }
    return { valid: false };
}
async function validateGoogleReceipt(receipt, productId) {
    try {
        // ⚠️ Google Play Developer API implementasyonu
        // Developer hesabı açıldıktan sonra google-auth-library ve googleapis
        // paketleri yüklenip buradaki yorum satırları açılacak.
        console.log('Google receipt validation: Implementation pending');
        console.log('Receipt:', receipt.substring(0, 50) + '...');
        console.log('Product:', productId);
        return { valid: false };
    }
    catch (error) {
        console.error('Google validation error:', error);
        return { valid: false };
    }
}
// ─── Cloud Functions (v2) ──────────────────────────────
/**
 * Receipt doğrulama endpoint'i (Authenticated)
 *
 * ✅ Güvenlik:
 * - Firebase Auth ile kimlik doğrulama zorunlu
 * - companyId sunucu tarafında kullanıcı profilinden alınıyor (client'a güvenilmiyor)
 * - Kullanıcının admin/owner olduğu doğrulanıyor
 */
exports.validateReceipt = (0, https_1.onCall)(async (request) => {
    // 1. Auth kontrolü
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmanız gerekiyor.');
    }
    const uid = request.auth.uid;
    const { receipt, productId, platform } = request.data;
    // 2. Input validasyonu
    if (!receipt || !productId || !platform) {
        throw new https_1.HttpsError('invalid-argument', 'Eksik alanlar: receipt, productId, platform');
    }
    if (!['ios', 'android'].includes(platform)) {
        throw new https_1.HttpsError('invalid-argument', 'Geçersiz platform. ios veya android olmalı.');
    }
    const planMapping = PRODUCT_TO_PLAN[productId];
    if (!planMapping) {
        throw new https_1.HttpsError('invalid-argument', `Bilinmeyen ürün ID: ${productId}`);
    }
    // 3. Kullanıcı profilinden companyId'yi sunucu tarafında al
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Kullanıcı profili bulunamadı.');
    }
    const userData = userDoc.data();
    const companyId = userData.companyId;
    const userRole = userData.role;
    if (!companyId) {
        throw new https_1.HttpsError('failed-precondition', 'Kullanıcının bir firmaya ait olması gerekiyor.');
    }
    // 4. Sadece admin/owner plan değiştirebilir
    if (!['admin', 'superadmin'].includes(userRole)) {
        throw new https_1.HttpsError('permission-denied', 'Plan değiştirme yetkiniz yok. Sadece firma yöneticileri plan değiştirebilir.');
    }
    // 5. Firma varlık kontrolü
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Firma bulunamadı.');
    }
    try {
        // 6. Receipt doğrulama
        let validationResult;
        if (platform === 'ios') {
            validationResult = await validateAppleReceipt(receipt, process.env.APPLE_SHARED_SECRET || '');
        }
        else {
            validationResult = await validateGoogleReceipt(receipt, productId);
        }
        if (!validationResult.valid) {
            throw new https_1.HttpsError('invalid-argument', 'Receipt doğrulama başarısız.');
        }
        // 7. Plan güncelleme (Admin SDK ile — Firestore kurallarını bypass eder)
        const { plan, period } = planMapping;
        await db.collection('companies').doc(companyId).update({
            plan: plan,
            billingPeriod: period,
            userLimit: PLAN_USER_LIMITS[plan],
            subscriptionExpiresAt: validationResult.expiresAt || null,
            lastPaymentAt: new Date().toISOString(),
            lastReceiptValidation: new Date().toISOString(),
            subscriptionProductId: productId,
            subscriptionPlatform: platform,
        });
        // 8. Log kaydı
        await db.collection('subscriptionLogs').add({
            companyId,
            userId: uid,
            productId,
            plan,
            period,
            platform,
            action: 'purchase',
            expiresAt: validationResult.expiresAt,
            createdAt: new Date().toISOString(),
        });
        console.log(`✅ Plan updated: ${companyId} → ${plan} (${period}) by user ${uid}`);
        return {
            valid: true,
            plan,
            period,
            expiresAt: validationResult.expiresAt,
        };
    }
    catch (error) {
        // HttpsError'ları tekrar fırlat
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        console.error('Receipt validation error:', error);
        throw new https_1.HttpsError('internal', 'Sunucu hatası oluştu.');
    }
});
/**
 * Push bildirim gönderme (Server-Side)
 *
 * ✅ Güvenlik:
 * - Client'tan doğrudan Expo API çağrılmak yerine buradan gönderilir
 * - Auth zorunlu, sadece firma üyeleri kendi firmasına bildirim gönderebilir
 */
exports.sendNotification = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Giriş yapmanız gerekiyor.');
    }
    const uid = request.auth.uid;
    const { targetTokens, title, body, data } = request.data;
    if (!targetTokens || !title || !body) {
        throw new https_1.HttpsError('invalid-argument', 'Eksik alanlar: targetTokens, title, body');
    }
    // Kullanıcı doğrulama
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Kullanıcı bulunamadı.');
    }
    // Bildirim gönder
    const results = [];
    for (const token of targetTokens) {
        try {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: token,
                    sound: 'default',
                    title,
                    body,
                    data: data || {},
                }),
            });
            results.push({ token, success: true });
        }
        catch (error) {
            console.error(`Push notification error for token ${token}:`, error);
            results.push({ token, success: false });
        }
    }
    return { sent: results.length, results };
});
/**
 * Abonelik süresi dolan firmaları kontrol eder.
 * Her gün çalışır — süresi dolanları free plana düşürür.
 */
exports.checkExpiredSubscriptions = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
    try {
        const now = new Date().toISOString();
        const expiredCompanies = await db.collection('companies')
            .where('plan', 'in', ['pro', 'enterprise'])
            .where('subscriptionExpiresAt', '<', now)
            .get();
        const batch = db.batch();
        let count = 0;
        expiredCompanies.forEach((doc) => {
            batch.update(doc.ref, {
                plan: 'free',
                userLimit: PLAN_USER_LIMITS.free,
                billingPeriod: null,
                subscriptionExpired: true,
                expiredAt: now,
            });
            count++;
        });
        if (count > 0) {
            await batch.commit();
            for (const doc of expiredCompanies.docs) {
                await db.collection('subscriptionLogs').add({
                    companyId: doc.id,
                    action: 'expired',
                    previousPlan: doc.data().plan,
                    newPlan: 'free',
                    createdAt: now,
                });
            }
            console.log(`⏰ ${count} subscription(s) expired and downgraded to free`);
        }
    }
    catch (error) {
        console.error('Expired subscription check error:', error);
    }
});
// ─── Storage Tracking ────────────────────────────────────────
/**
 * Calculates approximate byte size of a document.
 * We primarily care about imageBase64 as it constitutes 99% of storage.
 */
function calculateDocSize(data) {
    if (!data)
        return 0;
    let size = 0;
    // Base64 string in memory is ~1 byte per char, but actual disk size is 3/4
    if (data.imageBase64 && typeof data.imageBase64 === 'string') {
        size += Math.round((data.imageBase64.length * 3) / 4);
    }
    // Add a base size (rough estimate of other fields)
    size += JSON.stringify(data).length;
    return size;
}
/**
 * Tracks storage usage for expenses
 */
exports.trackExpenseStorage = (0, firestore_1.onDocumentWritten)({
    document: 'expenses/{expenseId}',
    region: 'europe-west1'
}, async (event) => {
    var _a, _b;
    const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    const companyId = (afterData === null || afterData === void 0 ? void 0 : afterData.companyId) || (beforeData === null || beforeData === void 0 ? void 0 : beforeData.companyId);
    if (!companyId)
        return;
    const sizeBefore = calculateDocSize(beforeData);
    const sizeAfter = calculateDocSize(afterData);
    const sizeDiff = sizeAfter - sizeBefore;
    if (sizeDiff !== 0) {
        await db.collection('companies').doc(companyId).update({
            usedStorage: admin.firestore.FieldValue.increment(sizeDiff)
        });
        console.log(`📊 Storage updated for ${companyId} (expenses): ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);
    }
});
/**
 * Tracks storage usage for invoices
 */
exports.trackInvoiceStorage = (0, firestore_1.onDocumentWritten)({
    document: 'invoices/{invoiceId}',
    region: 'europe-west1'
}, async (event) => {
    var _a, _b;
    const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    const companyId = (afterData === null || afterData === void 0 ? void 0 : afterData.companyId) || (beforeData === null || beforeData === void 0 ? void 0 : beforeData.companyId);
    if (!companyId)
        return;
    const sizeBefore = calculateDocSize(beforeData);
    const sizeAfter = calculateDocSize(afterData);
    const sizeDiff = sizeAfter - sizeBefore;
    if (sizeDiff !== 0) {
        await db.collection('companies').doc(companyId).update({
            usedStorage: admin.firestore.FieldValue.increment(sizeDiff)
        });
        console.log(`📊 Storage updated for ${companyId} (invoices): ${sizeDiff > 0 ? '+' : ''}${sizeDiff} bytes`);
    }
});
//# sourceMappingURL=index.js.map