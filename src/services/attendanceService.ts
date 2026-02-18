import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    addDoc,
    orderBy,
    limit,
} from '@react-native-firebase/firestore';

const db = getFirestore();

// ─── Types ─────────────────────────────────────────────────
export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    companyId: string;
    date: string;           // "2026-02-17"
    checkInTime: string;    // ISO timestamp
    qrToken: string;
    createdAt: string;
}

export interface AttendanceQR {
    id: string;
    companyId: string;
    token: string;
    date: string;           // "2026-02-17"
    createdBy: string;
    expiresAt: string;      // ISO timestamp (gün sonu)
    isActive: boolean;
    createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────
function getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
}

// ─── QR Token Yönetimi ────────────────────────────────────
export async function generateDailyQR(
    companyId: string,
    createdBy: string
): Promise<AttendanceQR> {
    const today = getTodayDateString();

    // Bugün zaten aktif QR var mı?
    const existing = await getTodayQR(companyId);
    if (existing) {
        return existing;
    }

    const token = `WF-${companyId.substring(0, 6)}-${today}-${generateToken()}`;
    const now = new Date();
    const expiresAt = getEndOfDay(now);

    const ref = await addDoc(collection(db, 'attendanceQR'), {
        companyId,
        token,
        date: today,
        createdBy,
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        createdAt: now.toISOString(),
    });

    return {
        id: ref.id,
        companyId,
        token,
        date: today,
        createdBy,
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        createdAt: now.toISOString(),
    };
}

export async function getTodayQR(companyId: string): Promise<AttendanceQR | null> {
    const today = getTodayDateString();
    const q = query(
        collection(db, 'attendanceQR'),
        where('companyId', '==', companyId),
        where('date', '==', today),
        where('isActive', '==', true),
        limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as AttendanceQR;
}

// ─── Yoklama Kayıt ────────────────────────────────────────
export async function checkIn(
    userId: string,
    userName: string,
    companyId: string,
    qrToken: string
): Promise<{ success: boolean; message: string }> {
    const today = getTodayDateString();

    // QR token geçerli mi kontrol et
    const qrQuery = query(
        collection(db, 'attendanceQR'),
        where('token', '==', qrToken),
        where('isActive', '==', true),
        limit(1)
    );
    const qrSnap = await getDocs(qrQuery);

    if (qrSnap.empty) {
        return { success: false, message: 'Geçersiz veya süresi dolmuş QR kod.' };
    }

    const qrDoc = qrSnap.docs[0].data() as AttendanceQR;

    // Şirket eşleşiyor mu?
    if (qrDoc.companyId !== companyId) {
        return { success: false, message: 'Bu QR kod şirketinize ait değil.' };
    }

    // QR bugüne ait mi?
    if (qrDoc.date !== today) {
        return { success: false, message: 'Bu QR kodun süresi dolmuş.' };
    }

    // Bugün zaten yoklama verilmiş mi?
    const alreadyChecked = await hasCheckedInToday(userId, companyId);
    if (alreadyChecked) {
        return { success: false, message: 'Bugün zaten yoklama verdiniz.' };
    }

    // Yoklama kaydını oluştur
    const now = new Date();
    await addDoc(collection(db, 'attendance'), {
        userId,
        userName,
        companyId,
        date: today,
        checkInTime: now.toISOString(),
        qrToken,
        createdAt: now.toISOString(),
    });

    return { success: true, message: 'Yoklama başarıyla kaydedildi!' };
}

// ─── Sorgulama ────────────────────────────────────────────
export async function hasCheckedInToday(
    userId: string,
    companyId: string
): Promise<boolean> {
    const today = getTodayDateString();
    const q = query(
        collection(db, 'attendance'),
        where('userId', '==', userId),
        where('companyId', '==', companyId),
        where('date', '==', today),
        limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function getAttendanceByDate(
    companyId: string,
    date: string
): Promise<AttendanceRecord[]> {
    const q = query(
        collection(db, 'attendance'),
        where('companyId', '==', companyId),
        where('date', '==', date),
        orderBy('checkInTime', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}

export async function getAttendanceByDateRange(
    companyId: string,
    startDate: string,
    endDate: string
): Promise<AttendanceRecord[]> {
    const q = query(
        collection(db, 'attendance'),
        where('companyId', '==', companyId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('checkInTime', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AttendanceRecord));
}

export async function getTodayAttendanceCount(companyId: string): Promise<number> {
    const today = getTodayDateString();
    const records = await getAttendanceByDate(companyId, today);
    return records.length;
}
