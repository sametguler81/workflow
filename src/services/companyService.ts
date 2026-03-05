import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    updateDoc,
    addDoc,
    increment,
} from '@react-native-firebase/firestore';

const db = getFirestore();

export interface Company {
    id: string;
    name: string;
    ownerId: string;
    plan: 'free' | 'pro' | 'enterprise';
    userLimit: number;
    usedStorage?: number;
    createdAt: string;
}

export async function getCompany(companyId: string): Promise<Company | null> {
    const snap = await getDoc(doc(db, 'companies', companyId));
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Company;
    }
    return null;
}

export async function getCompanyMembers(companyId: string) {
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
}

export async function inviteUser(
    email: string,
    displayName: string,
    role: 'personel' | 'idari' | 'muhasebe',
    companyId: string,
    companyName: string
) {
    const ref = await addDoc(collection(db, 'invitations'), {
        email,
        displayName,
        role,
        companyId,
        companyName,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}

export async function updateUserRole(
    uid: string,
    role: 'personel' | 'idari' | 'muhasebe'
) {
    await updateDoc(doc(db, 'users', uid), { role });
}

/**
 * Helper to update the company usedStorage when files are uploaded or deleted.
 * @param companyId The ID of the company
 * @param sizeChangeBytes Positive number for additions, negative for deletions
 */
export async function updateCompanyStorageUsage(companyId: string, sizeChangeBytes: number): Promise<void> {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
        usedStorage: increment(sizeChangeBytes)
    });
}
