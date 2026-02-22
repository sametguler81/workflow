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

const db = getFirestore();

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
    id: string;
    userId: string;
    userName: string;
    companyId: string;
    amount: number;
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
        if (value === undefined) {
            cleanedData[key] = deleteField();
        } else {
            cleanedData[key] = value;
        }
    });

    const ref = await addDoc(collection(db, 'expenses'), {
        ...cleanedData,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });
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
    await updateDoc(doc(db, 'expenses', expenseId), {
        status,
        reviewedBy,
        reviewNote: reviewNote || '',
        updatedAt: new Date().toISOString(),
    });
}

export async function updateExpense(
    expenseId: string,
    data: Partial<Omit<Expense, 'id' | 'createdAt'>>
): Promise<void> {
    const updateData = {
        ...data,
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
    await deleteDoc(doc(db, 'expenses', expenseId));
}
export async function markExpenseAsReimbursed(expenseId: string): Promise<void> {
    await updateDoc(doc(db, 'expenses', expenseId), {
        isReimbursed: true,
        reimbursementDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
}
