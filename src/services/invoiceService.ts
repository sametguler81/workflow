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
} from '@react-native-firebase/firestore';

const db = getFirestore();

export type DocumentType = 'fatura' | 'makbuz' | 'sozlesme' | 'diger';
export type InvoiceStatus = 'pending' | 'approved' | 'rejected';

export interface Invoice {
    id: string;
    userId: string;
    userName: string;
    companyId: string;
    documentType: DocumentType;
    amount: number;
    description: string;
    imageUri: string;
    imageBase64?: string;
    date: string;
    status: InvoiceStatus;
    reviewedBy?: string;
    reviewNote?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface InvoiceFilter {
    status?: InvoiceStatus | 'all';
    documentType?: DocumentType | 'all';
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
    const ref = await addDoc(collection(db, 'invoices'), {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });
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
    await updateDoc(doc(db, 'invoices', invoiceId), {
        status,
        reviewedBy,
        reviewNote: reviewNote || '',
        updatedAt: new Date().toISOString(),
    });
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
    await deleteDoc(doc(db, 'invoices', invoiceId));
}
