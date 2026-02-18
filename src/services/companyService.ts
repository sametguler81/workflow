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
} from '@react-native-firebase/firestore';

const db = getFirestore();

export interface Company {
    id: string;
    name: string;
    ownerId: string;
    plan: 'free' | 'pro' | 'enterprise';
    userLimit: number;
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
