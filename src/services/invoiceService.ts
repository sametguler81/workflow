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

import { createAnnouncement } from './announcementService';
import { notifyRolesInCompany, sendPushNotification } from './notificationService';
import { getCompany, updateCompanyStorageUsage } from './companyService';
import { PLAN_DETAILS } from '../constants/plans';
import { uploadFileToStorage, getFileSizeBytes } from './storageService';

const db = getFirestore();

export type DocumentType = 'fatura' | 'makbuz' | 'sozlesme' | 'diger';
export type InvoiceStatus = 'pending' | 'approved' | 'rejected';
export type TransactionDirection = 'income' | 'expense';
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export interface Invoice {
    id: string;
    userId: string;
    userName: string;
    companyId: string;
    documentType: DocumentType;
    amount: number;
    description: string;
    imageUri: string;
    imageBase64?: string | null;
    date: string;
    status: InvoiceStatus;
    direction: TransactionDirection;
    category: string;
    paymentStatus: PaymentStatus;
    dueDate?: string | null;
    reviewedBy?: string | null;
    reviewNote?: string | null;
    fileSizeBytes?: number; // Real uploaded file size for accurate storage tracking
    createdAt: string;
    updatedAt?: string;
}

export interface InvoiceFilter {
    status?: InvoiceStatus | 'all';
    documentType?: DocumentType | 'all';
    direction?: TransactionDirection | 'all';
    startDate?: Date;
    endDate?: Date;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    fatura: 'Fatura',
    makbuz: 'Makbuz',
    sozlesme: 'Sözleşme',
    diger: 'Diğer',
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
    fatura: 'document-text',
    makbuz: 'receipt',
    sozlesme: 'newspaper',
    diger: 'folder-open',
};

// ─── Create ─────────────────────────────────────────────
export async function createInvoice(
    data: Omit<Invoice, 'id' | 'status' | 'createdAt'>
): Promise<string> {
    // Build cleaned payload (strip undefined values)
    const modifiedData: any = {};
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
            modifiedData[key] = value;
        }
    });

    // ─── Storage Limit Check ─────────────────────────────
    const company = await getCompany(data.companyId);
    if (!company) throw new Error('Firma bilgisi bulunamadı.');

    const currentPlan = PLAN_DETAILS[company.plan || 'free'];
    const limitBytes = currentPlan.storageLimit;

    let downloadURL = modifiedData.imageUri;
    let realFileSizeBytes = 0;

    // Measure real file size BEFORE upload (so limit check uses actual bytes)
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

    // Upload file to Firebase Storage and record real size
    if (downloadURL && downloadURL.startsWith('file://')) {
        const destination = `companies/${modifiedData.companyId}/invoices/${modifiedData.userId}`;
        const result = await uploadFileToStorage(downloadURL, destination);
        downloadURL = result.downloadURL;
        realFileSizeBytes = result.sizeBytes || realFileSizeBytes;
        modifiedData.fileSizeBytes = realFileSizeBytes;

        // Increment company storage usage by real file size
        await updateCompanyStorageUsage(modifiedData.companyId, realFileSizeBytes);
    }

    modifiedData.imageUri = downloadURL;
    delete modifiedData.imageBase64; // ensure we don't save any base64 string to Firestore

    const ref = await addDoc(collection(db, 'invoices'), {
        ...modifiedData,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });


    // Trigger Notification for Muhasebe & Admin
    try {
        await createAnnouncement({
            companyId: data.companyId,
            title: 'Yeni Fatura/Belge Yüklendi',
            message: `${data.userName} yeni bir fatura/belge ekledi (${data.amount} ₺).`,
            createdBy: data.userId,
            createdByName: data.userName,
            targetType: 'selected',
            targetUserIds: [],
            targetRoles: ['muhasebe', 'admin'],
            type: 'notification',
            relatedId: ref.id,
            relatedType: 'invoice',
        });

        // Push Notification to Muhasebe and Admin directly
        await notifyRolesInCompany(
            data.companyId,
            ['muhasebe', 'admin', 'idari'],
            'Yeni Fatura/Belge Yüklendi',
            `${data.userName}, ${data.amount} ₺ tutarında ${DOCUMENT_TYPE_LABELS[data.documentType]} ekledi.`,
            { type: 'invoice', id: ref.id }
        );
    } catch (error) {
        console.error('Failed to send invoice notification:', error);
    }

    return ref.id;
}

// ─── Get user invoices ─────────────────────────────────
export async function getUserInvoices(
    userId: string,
    companyId: string,
    limitCount: number = 20,
    lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
    filter?: InvoiceFilter
): Promise<{ data: Invoice[]; lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null }> {
    let q = query(
        collection(db, 'invoices'),
        where('userId', '==', userId),
        where('companyId', '==', companyId)
    );

    if (filter?.status && filter.status !== 'all') {
        q = query(q, where('status', '==', filter.status));
    }
    if (filter?.documentType && filter.documentType !== 'all') {
        q = query(q, where('documentType', '==', filter.documentType));
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
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Invoice));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { data, lastDoc: lastVisible };
}

// ─── Get company invoices ──────────────────────────────
export async function getCompanyInvoices(
    companyId: string,
    limitCount: number = 20,
    lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
    filter?: InvoiceFilter
): Promise<{ data: Invoice[]; lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null }> {
    let q = query(
        collection(db, 'invoices'),
        where('companyId', '==', companyId)
    );

    if (filter?.status && filter.status !== 'all') {
        q = query(q, where('status', '==', filter.status));
    }
    if (filter?.documentType && filter.documentType !== 'all') {
        q = query(q, where('documentType', '==', filter.documentType));
    }
    if (filter?.direction && filter.direction !== 'all') {
        q = query(q, where('direction', '==', filter.direction));
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
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Invoice));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { data, lastDoc: lastVisible };
}

// ─── Update status ─────────────────────────────────────
export async function updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus,
    reviewedBy: string,
    reviewNote?: string
): Promise<void> {
    const docRef = doc(db, 'invoices', invoiceId);

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
            const data = snap.data() as Invoice;
            const message = status === 'approved'
                ? `Faturanız/Belgeniz onaylandı.`
                : status === 'rejected'
                    ? `Faturanız/Belgeniz reddedildi.`
                    : `Belge durumu güncellendi.`;

            await createAnnouncement({
                companyId: data.companyId,
                title: 'Fatura/Belge Durumu Güncellendi',
                message,
                createdBy: reviewedBy,
                createdByName: 'Muhasebe/Yönetici',
                targetType: 'selected',
                targetUserIds: [data.userId],
                type: 'notification',
                relatedId: invoiceId,
                relatedType: 'invoice',
            });

            // Push Notification to the employee who uploaded
            const userDocSnap = await getDoc(doc(db, 'users', data.userId));
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as any;
                if (userData.expoPushToken) {
                    await sendPushNotification(
                        userData.expoPushToken,
                        'Belge Durumu Güncellendi',
                        message,
                        { type: 'invoice', id: invoiceId }
                    );
                }
            }
        }
    } catch (err) {
        console.error('Failed to notify invoice status update', err);
    }
}

export async function updateInvoice(
    invoiceId: string,
    data: Partial<Omit<Invoice, 'id' | 'createdAt'>>
): Promise<void> {
    let updateData: any = { ...data };

    if (updateData.imageUri && updateData.imageUri.startsWith('file://')) {
        const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
        if (invoiceDoc.exists()) {
            const currentData = invoiceDoc.data() as Invoice;
            const destination = `companies/${currentData.companyId}/invoices/${currentData.userId}`;
            const downloadURL = await uploadFileToStorage(updateData.imageUri, destination);
            updateData.imageUri = downloadURL;
            updateData.imageBase64 = deleteField(); // explicitly clear to save DB space

            // Track the added image size roughly
            if (!currentData.imageUri && !currentData.imageBase64) {
                await updateCompanyStorageUsage(currentData.companyId, 300000);
            }
        }
    } else {
        delete updateData.imageBase64;
    }

    // Ensure we don't pass undefined fields which firestore rejects
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    updateData = {
        ...updateData,
        updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'invoices', invoiceId), updateData);
}

// ─── Get by ID ─────────────────────────────────────────
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const snap = await getDoc(doc(db, 'invoices', invoiceId));
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Invoice;
    }
    return null;
}

// ─── Delete ────────────────────────────────────────────
export async function deleteInvoice(invoiceId: string): Promise<void> {
    const invoiceDoc = await getDoc(doc(db, 'invoices', invoiceId));
    if (invoiceDoc.exists()) {
        const data = invoiceDoc.data() as Invoice;
        if (data.imageUri || data.imageBase64) {
            // Decrement by the real stored file size (fall back to 0 if missing)
            const sizeToReclaim = data.fileSizeBytes || 0;
            if (sizeToReclaim > 0) {
                await updateCompanyStorageUsage(data.companyId, -sizeToReclaim);
            }
        }
    }

    await deleteDoc(doc(db, 'invoices', invoiceId));
}
