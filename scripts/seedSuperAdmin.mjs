/**
 * Super Admin Hesabı Oluşturma Scripti
 * 
 * Kullanım:
 *   node scripts/seedSuperAdmin.mjs
 * 
 * Bu script Firebase Auth'da yeni bir kullanıcı oluşturur
 * ve Firestore'da superadmin rolüyle kaydeder.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// ─── Firebase Config ───────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyB82HC09wIkZIHJghiPa-IYqHiZddBvkOE",
    projectId: "workflow-cc284",
    storageBucket: "workflow-cc284.firebasestorage.app",
    messagingSenderId: "521952446432",
    appId: "1:521952446432:android:ecb44e1427f0f00edc0d85",
};

// ─── Super Admin Bilgileri ─────────────────────────────
const ADMIN_EMAIL = "superadmin@workflow.com";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Super Admin";

// ─── Script ────────────────────────────────────────────
async function seedSuperAdmin() {
    console.log("🚀 Super Admin hesabı oluşturuluyor...\n");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    try {
        // 1. Firebase Auth'da kullanıcı oluştur
        console.log(`📧 E-posta: ${ADMIN_EMAIL}`);
        console.log(`🔑 Şifre: ${ADMIN_PASSWORD}`);
        console.log("");

        const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        const uid = cred.user.uid;
        console.log(`✅ Auth kullanıcı oluşturuldu: ${uid}`);

        // 2. Firestore'a superadmin belgesi yaz
        await setDoc(doc(db, "users", uid), {
            uid: uid,
            email: ADMIN_EMAIL,
            displayName: ADMIN_NAME,
            role: "superadmin",
            companyId: "platform",
            companyName: "Platform Yönetimi",
            createdAt: new Date().toISOString(),
        });
        console.log("✅ Firestore belgesi oluşturuldu (role: superadmin)\n");

        console.log("═══════════════════════════════════════");
        console.log("  SUPER ADMIN HESABI HAZIR!");
        console.log("═══════════════════════════════════════");
        console.log(`  E-posta : ${ADMIN_EMAIL}`);
        console.log(`  Şifre   : ${ADMIN_PASSWORD}`);
        console.log(`  UID     : ${uid}`);
        console.log("═══════════════════════════════════════\n");
        console.log("Uygulamada bu hesapla giriş yapabilirsiniz.");

        process.exit(0);
    } catch (err) {
        if (err.code === "auth/email-already-in-use") {
            console.log("⚠️  Bu e-posta zaten kullanımda.");
            console.log("    Firebase Console'dan users tablosunda bu");
            console.log("    kullanıcının role alanını 'superadmin' yapın.");
        } else {
            console.error("❌ Hata:", err.message);
        }
        process.exit(1);
    }
}

seedSuperAdmin();
