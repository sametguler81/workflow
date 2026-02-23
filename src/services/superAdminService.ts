import {
    getFirestore,
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
    updateDoc,
    deleteDoc,
    setDoc,
    orderBy,
    limit,
    startAfter,
} from '@react-native-firebase/firestore';
import {
    getAuth,
    createUserWithEmailAndPassword,
} from '@react-native-firebase/auth';
import { getApp, initializeApp } from '@react-native-firebase/app';
import { PLAN_DETAILS } from '../constants/plans';

const db = getFirestore();

// ─── Types ─────────────────────────────────────────────────

export interface PlatformStats {
    totalCompanies: number;
    totalUsers: number;
    totalLeaves: number;
    totalExpenses: number;
    totalInvoices: number;
    totalAttendance: number;
    planDistribution: {
        free: number;
        pro: number;
        enterprise: number;
    };
    recentCompanies: any[];
    recentUsers: any[];
}

export interface CompanyWithStats {
    id: string;
    name: string;
    ownerId: string;
    plan: 'free' | 'pro' | 'enterprise';
    userLimit: number;
    createdAt: string;
    memberCount?: number;
    ownerName?: string;
    ownerEmail?: string;
}

// ─── Platform Genel İstatistikler ──────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
    const [companiesSnap, usersSnap, leavesSnap, expensesSnap, invoicesSnap, attendanceSnap] = await Promise.all([
        getDocs(collection(db, 'companies')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'leaves')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'attendance')),
    ]);

    const companies = companiesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const planDistribution = {
        free: companies.filter((c: any) => c.plan === 'free').length,
        pro: companies.filter((c: any) => c.plan === 'pro').length,
        enterprise: companies.filter((c: any) => c.plan === 'enterprise').length,
    };

    // Son 5 firma
    const sortedCompanies = [...companies].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Son 5 kullanıcı
    const users = usersSnap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
    const sortedUsers = [...users].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
        totalCompanies: companiesSnap.size,
        totalUsers: usersSnap.size,
        totalLeaves: leavesSnap.size,
        totalExpenses: expensesSnap.size,
        totalInvoices: invoicesSnap.size,
        totalAttendance: attendanceSnap.size,
        planDistribution,
        recentCompanies: sortedCompanies.slice(0, 5),
        recentUsers: sortedUsers.slice(0, 5),
    };
}

// ─── Firma İşlemleri ───────────────────────────────────────

export async function getAllCompanies(): Promise<CompanyWithStats[]> {
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const usersSnap = await getDocs(collection(db, 'users'));

    const users = usersSnap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));

    const companies: CompanyWithStats[] = companiesSnap.docs.map((d: any) => {
        const data = d.data();
        const companyUsers = users.filter((u: any) => u.companyId === d.id);
        const owner = users.find((u: any) => u.uid === data.ownerId);

        return {
            id: d.id,
            name: data.name,
            ownerId: data.ownerId,
            plan: data.plan || 'free',
            userLimit: data.userLimit || 5,
            createdAt: data.createdAt,
            memberCount: companyUsers.length,
            ownerName: owner?.displayName || '-',
            ownerEmail: owner?.email || '-',
        };
    });

    return companies.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getCompanyDetailById(companyId: string) {
    const companySnap = await getDoc(doc(db, 'companies', companyId));
    if (!companySnap.exists()) return null;

    const companyData = companySnap.data();

    // Get members
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const membersSnap = await getDocs(q);
    const members = membersSnap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));

    // Get stats
    const [leavesSnap, expensesSnap, invoicesSnap] = await Promise.all([
        getDocs(query(collection(db, 'leaves'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'expenses'), where('companyId', '==', companyId))),
        getDocs(query(collection(db, 'invoices'), where('companyId', '==', companyId))),
    ]);

    const expenses = expensesSnap.docs.map((d: any) => d.data());
    const totalExpenseAmount = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    return {
        id: companyId,
        ...companyData,
        members,
        stats: {
            memberCount: members.length,
            leaveCount: leavesSnap.size,
            expenseCount: expensesSnap.size,
            invoiceCount: invoicesSnap.size,
            totalExpenseAmount,
        },
    };
}

export async function updateCompanyPlan(
    companyId: string,
    plan: 'free' | 'pro' | 'enterprise',
    userLimit: number
): Promise<void> {
    await updateDoc(doc(db, 'companies', companyId), {
        plan,
        userLimit,
        updatedAt: new Date().toISOString(),
    });
}

export async function updateCompanyDetails(companyId: string, data: { name: string }): Promise<void> {
    await updateDoc(doc(db, 'companies', companyId), {
        name: data.name,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteCompany(companyId: string): Promise<void> {
    await deleteDoc(doc(db, 'companies', companyId));
}

// ─── Kullanıcı İşlemleri ──────────────────────────────────

export async function getUsers(filters: { role?: string; companyId?: string; limit?: number; startAfterDoc?: any; } = {}) {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    if (filters.role && filters.role !== 'all') {
        q = query(q, where('role', '==', filters.role));
    }

    if (filters.companyId && filters.companyId !== 'all') {
        q = query(q, where('companyId', '==', filters.companyId));
    }

    if (filters.startAfterDoc) {
        q = query(q, startAfter(filters.startAfterDoc));
    }

    if (filters.limit) {
        q = query(q, limit(filters.limit));
    }

    const snap = await getDocs(q);
    const users = snap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return { users, lastDoc };
}

export async function updateUserRoleAdmin(
    uid: string,
    role: 'personel' | 'idari' | 'muhasebe' | 'admin'
): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { role });
}

export async function updateUserDetails(uid: string, data: { displayName?: string }): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid));
}

export async function addUserToCompany(
    email: string,
    password: string,
    displayName: string,
    role: 'personel' | 'idari' | 'muhasebe' | 'admin',
    companyId: string,
    companyName: string
): Promise<string> {
    let secondaryApp = null;
    try {
        const app = getApp();
        const secondaryAppName = `admin_secondary_${Date.now()}`;
        const options = {
            apiKey: app.options.apiKey,
            appId: app.options.appId,
            projectId: app.options.projectId,
            messagingSenderId: app.options.messagingSenderId,
            storageBucket: app.options.storageBucket,
            databaseURL: app.options.databaseURL || `https://${app.options.projectId}.firebaseio.com`,
        };

        secondaryApp = await initializeApp(options, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);

        await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            email,
            displayName,
            role,
            companyId,
            companyName,
            createdAt: new Date().toISOString(),
        });

        return cred.user.uid;
    } finally {
        if (secondaryApp) {
            try {
                await (secondaryApp as any).delete();
            } catch (e) {
                console.log('Error deleting secondary app:', e);
            }
        }
    }
}

export async function createCompanyAdmin(
    companyName: string,
    plan: 'free' | 'pro' | 'enterprise',
    ownerName: string,
    ownerEmail: string,
    ownerPassword: string
): Promise<void> {
    let secondaryApp = null;
    try {
        const app = getApp();
        const secondaryAppName = `admin_create_company_${Date.now()}`;
        const options = {
            apiKey: app.options.apiKey,
            appId: app.options.appId,
            projectId: app.options.projectId,
            messagingSenderId: app.options.messagingSenderId,
            storageBucket: app.options.storageBucket,
            databaseURL: app.options.databaseURL || `https://${app.options.projectId}.firebaseio.com`,
        };

        secondaryApp = await initializeApp(options, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        // 1. Create User
        const cred = await createUserWithEmailAndPassword(secondaryAuth, ownerEmail, ownerPassword);
        const uid = cred.user.uid;
        const companyId = uid + '_company';

        // 2. Create Company Document
        const planDetails = PLAN_DETAILS[plan];
        await setDoc(doc(db, 'companies', companyId), {
            id: companyId,
            name: companyName,
            plan: plan,
            userLimit: planDetails.userLimit,
            ownerId: uid,
            createdAt: new Date().toISOString(),
        });

        // 3. Create User Document (Owner is Admin)
        await setDoc(doc(db, 'users', uid), {
            uid: uid,
            email: ownerEmail,
            displayName: ownerName,
            role: 'admin',
            companyId: companyId,
            companyName: companyName,
            createdAt: new Date().toISOString(),
        });

    } finally {
        if (secondaryApp) {
            try {
                await (secondaryApp as any).delete();
            } catch (e) {
                console.log('Error deleting secondary app:', e);
            }
        }
    }
}

// ─── Abonelik Plan Bilgileri ──────────────────────────────

export { PLAN_DETAILS };


// ─── Platform Rapor İstatistikleri ─────────────────────────

export async function getPlatformReportStats() {
    const [leavesSnap, expensesSnap, invoicesSnap, usersSnap, companiesSnap] = await Promise.all([
        getDocs(collection(db, 'leaves')),
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'companies')),
    ]);

    const leaves = leavesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const expenses = expensesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const invoices = invoicesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const users = usersSnap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
    const companies = companiesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return {
        leaves: {
            total: leaves.length,
            pending: leaves.filter((l: any) => l.status === 'pending').length,
            approved: leaves.filter((l: any) => l.status === 'approved').length,
            rejected: leaves.filter((l: any) => l.status === 'rejected').length,
        },
        expenses: {
            total: expenses.length,
            pending: expenses.filter((e: any) => e.status === 'pending').length,
            approved: expenses.filter((e: any) => e.status === 'approved').length,
            rejected: expenses.filter((e: any) => e.status === 'rejected').length,
            totalAmount: expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
            approvedAmount: expenses.filter((e: any) => e.status === 'approved').reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
        },
        invoices: {
            total: invoices.length,
            pending: invoices.filter((i: any) => i.status === 'pending').length,
            approved: invoices.filter((i: any) => i.status === 'approved').length,
            rejected: invoices.filter((i: any) => i.status === 'rejected').length,
            totalAmount: invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
        },
        users: {
            total: users.length,
            byRole: {
                personel: users.filter((u: any) => u.role === 'personel').length,
                idari: users.filter((u: any) => u.role === 'idari').length,
                muhasebe: users.filter((u: any) => u.role === 'muhasebe').length,
                admin: users.filter((u: any) => u.role === 'admin').length,
            },
        },
        companies: {
            total: companies.length,
            byPlan: {
                free: companies.filter((c: any) => c.plan === 'free').length,
                pro: companies.filter((c: any) => c.plan === 'pro').length,
                enterprise: companies.filter((c: any) => c.plan === 'enterprise').length,
            },
        },
    };
}
