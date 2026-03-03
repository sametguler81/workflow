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
exports.checkExpiredSubscriptions = exports.validateReceipt = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
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
 * Receipt doğrulama endpoint'i
 */
exports.validateReceipt = (0, https_1.onRequest)(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { receipt, productId, companyId, platform } = req.body;
    if (!receipt || !productId || !companyId || !platform) {
        res.status(400).json({
            valid: false,
            error: 'Missing required fields: receipt, productId, companyId, platform',
        });
        return;
    }
    const planMapping = PRODUCT_TO_PLAN[productId];
    if (!planMapping) {
        res.status(400).json({
            valid: false,
            error: `Unknown product ID: ${productId}`,
        });
        return;
    }
    try {
        let validationResult;
        if (platform === 'ios') {
            validationResult = await validateAppleReceipt(receipt, process.env.APPLE_SHARED_SECRET || '');
        }
        else {
            validationResult = await validateGoogleReceipt(receipt, productId);
        }
        if (!validationResult.valid) {
            res.status(400).json({
                valid: false,
                error: 'Receipt validation failed',
            });
            return;
        }
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
        await db.collection('subscriptionLogs').add({
            companyId,
            productId,
            plan,
            period,
            platform,
            action: 'purchase',
            expiresAt: validationResult.expiresAt,
            createdAt: new Date().toISOString(),
        });
        console.log(`✅ Plan updated: ${companyId} → ${plan} (${period})`);
        res.json({
            valid: true,
            plan,
            period,
            expiresAt: validationResult.expiresAt,
        });
    }
    catch (error) {
        console.error('Receipt validation error:', error);
        res.status(500).json({
            valid: false,
            error: 'Internal server error',
        });
    }
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
//# sourceMappingURL=index.js.map