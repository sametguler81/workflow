import {
    getFirestore,
    doc,
    getDoc,
    deleteDoc,
    getDocs,
    collection,
    query,
    where,
    updateDoc,
    addDoc,
    limit,
    orderBy,
    startAfter,
    FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

const db = getFirestore();
import { createAnnouncement } from './announcementService';

export type LeaveType = 'yillik' | 'hastalik' | 'ucretsiz';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
    id: string;
    userId: string;
    userName: string;
    companyId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    description: string;
    status: LeaveStatus;
    reviewedBy?: string;
    reviewNote?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface LeaveFilter {
    status?: LeaveStatus | 'all';
    startDate?: Date;
    endDate?: Date;
}



export async function createLeaveRequest(
    data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>
): Promise<string> {
    const ref = await addDoc(collection(db, 'leaves'), {
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString(),
    });

    // Trigger Notification for Idari
    try {
        await createAnnouncement({
            companyId: data.companyId,
            title: 'Yeni İzin Talebi',
            message: `${data.userName} (${getLeaveTypeLabel(data.type)}) için izin talep etti.`,
            createdBy: data.userId,
            createdByName: data.userName,
            targetType: 'selected', // Role-based
            targetUserIds: [],
            targetRole: 'idari',
            type: 'notification',
            relatedId: ref.id,
            relatedType: 'leave',
        });
    } catch (error) {
        console.error('Failed to send leave notification:', error);
    }

    return ref.id;
}

export async function getUserLeaves(
    userId: string,
    companyId: string,
    limitCount: number = 20,
    lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
    filter?: LeaveFilter
): Promise<{ data: LeaveRequest[]; lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null }> {
    let q = query(
        collection(db, 'leaves'),
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

    q = query(q, orderBy('createdAt', 'desc'));

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(limitCount));

    const snap = await getDocs(q);
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as LeaveRequest));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { data, lastDoc: lastVisible };
}

export async function getCompanyLeaves(
    companyId: string,
    limitCount: number = 20,
    lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
    filter?: LeaveFilter
): Promise<{ data: LeaveRequest[]; lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null }> {
    let q = query(
        collection(db, 'leaves'),
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
    const data = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as LeaveRequest));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;

    return { data, lastDoc: lastVisible };
}

export async function updateLeaveStatus(
    leaveId: string,
    status: LeaveStatus,
    reviewedBy: string,
    reviewNote?: string
): Promise<void> {
    await updateDoc(doc(db, 'leaves', leaveId), {
        status,
        reviewedBy,
        reviewNote: reviewNote || '',
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteLeave(leaveId: string): Promise<void> {
    await deleteDoc(doc(db, 'leaves', leaveId));
}

export async function getLeaveById(leaveId: string): Promise<LeaveRequest | null> {
    const snap = await getDoc(doc(db, 'leaves', leaveId));
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as LeaveRequest;
    }
    return null;
}

export function getLeaveTypeLabel(type: LeaveType): string {
    const labels: Record<LeaveType, string> = {
        yillik: 'Yıllık İzin',
        hastalik: 'Hastalık İzni',
        ucretsiz: 'Ücretsiz İzin',
    };
    return labels[type];
}
