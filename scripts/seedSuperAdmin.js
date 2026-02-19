/**
 * Super Admin Hesabı Oluşturma Scripti (REST API)
 * 
 * Kullanım:
 *   node scripts/seedSuperAdmin.js
 */

const API_KEY = "AIzaSyB82HC09wIkZIHJghiPa-IYqHiZddBvkOE";
const PROJECT_ID = "workflow-cc284";

const ADMIN_EMAIL = "superadmin@workflow.com";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Super Admin";

async function seedSuperAdmin() {
    console.log("\n🚀 Super Admin hesabı oluşturuluyor...\n");
    console.log("📧 E-posta: " + ADMIN_EMAIL);
    console.log("🔑 Şifre:   " + ADMIN_PASSWORD + "\n");

    // 1. Firebase Auth REST API - Kullanıcı oluştur
    console.log("⏳ Auth kullanıcı oluşturuluyor...");
    const authRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                returnSecureToken: true,
            }),
        }
    );

    const authData = await authRes.json();

    if (authData.error) {
        if (authData.error.message === "EMAIL_EXISTS") {
            console.log("⚠️  Bu e-posta zaten mevcut. Giriş yapılıyor...");

            // Mevcut hesaba giriş yap
            const loginRes = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: ADMIN_EMAIL,
                        password: ADMIN_PASSWORD,
                        returnSecureToken: true,
                    }),
                }
            );
            const loginData = await loginRes.json();
            if (loginData.error) {
                console.error("❌ Giriş hatası:", loginData.error.message);
                process.exit(1);
            }
            authData.localId = loginData.localId;
            authData.idToken = loginData.idToken;
            console.log("✅ Mevcut hesaba giriş yapıldı: " + authData.localId);
        } else {
            console.error("❌ Auth hatası:", authData.error.message);
            process.exit(1);
        }
    } else {
        console.log("✅ Auth kullanıcı oluşturuldu: " + authData.localId);
    }

    const uid = authData.localId;
    const idToken = authData.idToken;

    // 2. Firestore REST API - superadmin belgesi yaz
    console.log("⏳ Firestore belgesi oluşturuluyor...");

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;

    const docData = {
        fields: {
            uid: { stringValue: uid },
            email: { stringValue: ADMIN_EMAIL },
            displayName: { stringValue: ADMIN_NAME },
            role: { stringValue: "superadmin" },
            companyId: { stringValue: "platform" },
            companyName: { stringValue: "Platform Yönetimi" },
            createdAt: { stringValue: new Date().toISOString() },
        },
    };

    const fsRes = await fetch(firestoreUrl, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + idToken,
        },
        body: JSON.stringify(docData),
    });

    const fsData = await fsRes.json();

    if (fsData.error) {
        console.error("❌ Firestore hatası:", fsData.error.message);
        process.exit(1);
    }

    console.log("✅ Firestore belgesi oluşturuldu (role: superadmin)\n");

    console.log("═══════════════════════════════════════");
    console.log("  ✅ SUPER ADMIN HESABI HAZIR!");
    console.log("═══════════════════════════════════════");
    console.log("  E-posta : " + ADMIN_EMAIL);
    console.log("  Şifre   : " + ADMIN_PASSWORD);
    console.log("  UID     : " + uid);
    console.log("═══════════════════════════════════════\n");
    console.log("Uygulamada bu hesapla giriş yapabilirsiniz. 🎉");

    process.exit(0);
}

seedSuperAdmin();
