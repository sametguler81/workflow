import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    updateDoc,
    addDoc,
    limit,
    orderBy,
    startAfter,
    deleteDoc,
    FirebaseFirestoreTypes,
    deleteField,
} from '@react-native-firebase/firestore';
import { getStorage, ref, deleteObject } from '@react-native-firebase/storage';

import { createAnnouncement } from './announcementService';
import { notifyRolesInCompany, sendPushNotification } from './notificationService';
import { getCompany, updateCompanyStorageUsage } from './companyService';
import { PLAN_DETAILS } from '../constants/plans';
import { uploadFileToStorage, getFileSizeBytes } from './storageService';

const db = getFirestore();

import { CurrencyCode, convertToTRY } from './currencyService';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
    id: string;
    userId: string;
    userName: string;
    companyId: string;
    amount: number;
    currency?: CurrencyCode;
    amountInTRY?: number;
    exchangeRate?: number;
    description: string;
    imageUri: string;
    imageBase64?: string | null;
    date: string;
    status: ExpenseStatus;
    paymentMethod: 'personal' | 'company_card';
    isReimbursed?: boolean;
    reimbursementDate?: string;
    reviewedBy?: string | null;
    reviewNote?: string | null;
    fileSizeBytes?: number; // Real uploaded file size for accurate storage tracking
    createdAt: string;
    updatedAt?: string;
}

export interface ExpenseFilter {
    status?: ExpenseStatus | 'all';
    paymentMethod?: 'personal' | 'company_card' | 'all';
    startDate?: Date; // For createdAt filtering
    endDate?: Date;
}

export async function createExpense(
    data: Omit<Expense, 'id' | 'status' | 'createdAt'>
): Promise<string> {
    const cleanedData: any = {};
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanedData[key] = value;
        }
    });

    // ─── Storage Limit Check ─────────────────────────────
    const company = await getCompany(data.companyId);
    if (!company) throw new Error('Firma bilgisi bulunamadı.');

    const currentPlan = PLAN_DETAILS[company.plan || 'free'];
    const limitBytes = currentPlan.storageLimit;

    let downloadURL = cleanedData.imageUri;
    let realFileSizeBytes = 0;

    // Measure real file size before upload
    if (downloadURL && downloadURL.startsWith('file://')) {
        realFileSizeBytes = await getFileSizeBytes(downloadURL);
    }

    // Storage Size Limit Check (-1 means unlimited)
    if (limitBytes !== -1) {
        const currentUsage = company.usedStorage || 0;
        if (currentUsage + realFileSizeBytes > limitBytes) {
            const limitGB = (limitBytes / (1024 * 1024 * 1024)).toFixed(0);
            throw new Error(`Paketinizin depolama limiti dolmuştur (${limitGB} GB). Lütfen paketinizi yükseltin.`);
        }
    }

    // Upload file and get real size
    if (downloadURL && downloadURL.startsWith('file://')) {
        const destination = `companies/${data.companyId}/expenses/${data.userId}`;
        const result = await uploadFileToStorage(downloadURL, destination);
        downloadURL = result.downloadURL;
        realFileSizeBytes = result.sizeBytes || realFileSizeBytes;
        cleanedData.imageUri = downloadURL;
        cleanedData.fileSizeBytes = realFileSizeBytes;

        // Track the real uploaded file size
        await updateCompanyStorageUsage(data.companyId, realFileSizeBytes);
    }

    // Calculate amount in TRY using historical or current rates
    const currency = cleanedData.currency || 'TRY';
    const { amountInTRY, exchangeRate } = await convertToTRY(cleanedData.amount, currency, cleanedData.date);
    cleanedData.amountInTRY = amountInTRY;
    cleanedData.exchangeRate = exchangeRate;
    cleanedData.currency = currency;

    const ref = await addDoc(collection(db, 'expenses'), {
        ...cleanedData,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });

    // Trigger Notification for Muhasebe & Admin
    try {
        await createAnnouncement({
            companyId: data.companyId,
            title: 'Yeni Fiş/Masraf Talebi',
            message: `${data.userName} yeni bir fiş yükledi (${data.amount} ₺).`,
            createdBy: data.userId,
            createdByName: data.userName,
            targetType: 'selected', // Role-based
            targetUserIds: [],
            targetRoles: ['muhasebe', 'admin'],
            type: 'notification',
            relatedId: ref.id,
            relatedType: 'expense',
        });

        // Push Notification to Muhasebe and Admin
        await notifyRolesInCompany(
            data.companyId,
            ['muhasebe', 'admin', 'idari'],
            'Yeni Masraf/Fiş Talebi',
            `${data.userName}, ${data.amount} ₺ tutarında masraf ekledi.`,
            { type: 'expense', id: ref.id }
        );
    } catch (error) {
        console.error('Failed to send expense notification:', error);
    }

    return ref.id;
}

export async function getUserExpenses(
    userId: string,
    companyId: string,
    limitCount: number = 20,
    lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
    filter?: ExpenseFilter
): Promise<{ data: Expense[]; lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null }> {
    let q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('companyId', '==', companyId)
    );

    if (filter?.status && filter.status !== 'all') {
        q = query(q, where('status', '==', filter.status));
    }

    if (filter?.startDate) {
        q = query(q, where('createdAt', '>=', filter.startDate.toISOString()));
    }

    if (filter?.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        q = query(q, where('createdAt', '<=', end.toISOString()));
    }

    // Default sort by createdAt desc
    q = query(q, orderBy('createdAt', 'desc'));

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(limitCount));

    const snap = await getDocs(q);
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Expense));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { data, lastDoc: lastVisible };
}

export async function getCompanyExpenses(
    companyId: string,
    limitCount: number = 20,
    lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
    filter?: ExpenseFilter
): Promise<{ data: Expense[]; lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null }> {
    let q = query(
        collection(db, 'expenses'),
        where('companyId', '==', companyId)
    );

    if (filter?.status && filter.status !== 'all') {
        q = query(q, where('status', '==', filter.status));
    }

    if (filter?.startDate) {
        q = query(q, where('createdAt', '>=', filter.startDate.toISOString()));
    }

    if (filter?.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        q = query(q, where('createdAt', '<=', end.toISOString()));
    }

    q = query(q, orderBy('createdAt', 'desc'));

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(limitCount));

    const snap = await getDocs(q);
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Expense));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { data, lastDoc: lastVisible };
}

export async function updateExpenseStatus(
    expenseId: string,
    status: ExpenseStatus,
    reviewedBy: string,
    reviewNote?: string
): Promise<void> {
    const docRef = doc(db, 'expenses', expenseId);

    await updateDoc(docRef, {
        status,
        reviewedBy,
        reviewNote: reviewNote || '',
        updatedAt: new Date().toISOString(),
    });

    // Durum değiştiğinde talep sahibine Notification gönderelim
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data() as Expense;
            const message = status === 'approved'
                ? `Fişiniz/Masrafınız onaylandı.`
                : status === 'rejected'
                    ? `Fişiniz/Masrafınız reddedildi.`
                    : `Fiş durumu güncellendi.`;

            await createAnnouncement({
                companyId: data.companyId,
                title: 'Fiş/Masraf Durumu Güncellendi',
                message,
                createdBy: reviewedBy,
                createdByName: 'Muhasebe/Yönetici',
                targetType: 'selected',
                targetUserIds: [data.userId],
                type: 'notification',
                relatedId: expenseId,
                relatedType: 'expense',
            });

            // Push Notification to the employee
            const userDocSnap = await getDoc(doc(db, 'users', data.userId));
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as any;
                if (userData.expoPushToken) {
                    await sendPushNotification(
                        userData.expoPushToken,
                        'Masraf Durumu Güncellendi',
                        message,
                        { type: 'expense', id: expenseId }
                    );
                }
            }
        }
    } catch (err) {
        console.error('Failed to notify expense status update', err);
    }
}

export async function updateExpense(
    expenseId: string,
    data: Partial<Omit<Expense, 'id' | 'createdAt'>>
): Promise<void> {

    let updateData: any = { ...data };

    if (updateData.imageUri && updateData.imageUri.startsWith('file://')) {
        // If a new local image is provided during update, upload it first
        const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
        if (expenseDoc.exists()) {
            const currentData = expenseDoc.data() as Expense;
            const destination = `companies/${currentData.companyId}/expenses/${currentData.userId}`;
            const downloadURL = await uploadFileToStorage(updateData.imageUri, destination);
            updateData.imageUri = downloadURL;
            updateData.imageBase64 = deleteField(); // Free space in DB by explicitly removing old base64

            // Track the added image size roughly. If replacing, we could subtract old, 
            // but assuming mostly new uploads or old base64 strings being removed
            if (!currentData.imageUri && !currentData.imageBase64) {
                await updateCompanyStorageUsage(currentData.companyId, 300000);
            }
        }
    } else {
        delete updateData.imageBase64; // Don't try modifying or passing imageBase64
    }

    // Ensure we don't pass undefined fields which firestore rejects
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    if (updateData.amount !== undefined || updateData.currency !== undefined) {
        // If updating amount or currency, we must recalculate amountInTRY
        // We need the current currency if it wasn't provided, or current amount if it wasn't provided
        let targetAmount = updateData.amount;
        let targetCurrency = updateData.currency;
        
        if (targetAmount === undefined || targetCurrency === undefined) {
            const currentDoc = await getDoc(doc(db, 'expenses', expenseId));
            if (currentDoc.exists()) {
                const currentData = currentDoc.data() as Expense;
                if (targetAmount === undefined) targetAmount = currentData.amount;
                if (targetCurrency === undefined) targetCurrency = currentData.currency || 'TRY';
                if (!updateData.date) updateData.date = currentData.date;
            }
        }
        
        updateData.currency = targetCurrency || 'TRY';
        const { amountInTRY, exchangeRate } = await convertToTRY(targetAmount || 0, updateData.currency, updateData.date);
        updateData.amountInTRY = amountInTRY;
        updateData.exchangeRate = exchangeRate;
    }

    updateData = {
        ...updateData,
        updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'expenses', expenseId), updateData);
}

export async function getExpenseById(expenseId: string): Promise<Expense | null> {
    const snap = await getDoc(doc(db, 'expenses', expenseId));
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Expense;
    }
    return null;
}

export async function deleteExpense(expenseId: string): Promise<void> {
    const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
    if (expenseDoc.exists()) {
        const data = expenseDoc.data() as Expense;
        if (data.imageUri || data.imageBase64) {
            // Decrement by the real stored file size (fall back to 0 if missing)
            const sizeToReclaim = data.fileSizeBytes || 0;
            if (sizeToReclaim > 0) {
                await updateCompanyStorageUsage(data.companyId, -sizeToReclaim);
            }
            // Delete actual file from Firebase Storage if it's a remote URL
            if (data.imageUri && data.imageUri.startsWith('https://firebasestorage.googleapis.com')) {
                try {
                    const storage = getStorage();
                    const fileRef = ref(storage, data.imageUri);
                    await deleteObject(fileRef);
                } catch (e) {
                    console.log('Failed to delete file from storage', e);
                }
            }
        }
    }

    await deleteDoc(doc(db, 'expenses', expenseId));
}
export async function markExpenseAsReimbursed(expenseId: string): Promise<void> {
    await updateDoc(doc(db, 'expenses', expenseId), {
        isReimbursed: true,
        reimbursementDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}
