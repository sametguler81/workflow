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
    orderBy,
    deleteDoc,
    arrayUnion,
    onSnapshot,
} from '@react-native-firebase/firestore';

const db = getFirestore();

export interface Announcement {
    id: string;
    companyId: string;
    title: string;
    message: string;
    createdBy: string;
    createdByName: string;
    targetType: 'all' | 'selected';
    targetUserIds: string[];
    targetRoles?: string[]; // New: Target multiple roles (e.g., ['idari', 'admin'])
    type?: 'announcement' | 'notification'; // New: Distinguish system notifications
    relatedId?: string; // New: Link to leave/expense ID
    relatedType?: 'leave' | 'expense' | 'invoice'; // New: Type of related item
    readBy: string[];
    dismissedBy: string[];
    createdAt: string;
}

// ─── Create ─────────────────────────────────────────────
export async function createAnnouncement(
    data: Omit<Announcement, 'id' | 'readBy' | 'dismissedBy' | 'createdAt'>
): Promise<string> {
    const ref = await addDoc(collection(db, 'announcements'), {
        ...data,
        type: data.type || 'announcement', // Default to announcement
        readBy: [],
        dismissedBy: [],
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}

// ─── Get company announcements (visible to user) ───────
export async function getCompanyAnnouncements(
    companyId: string,
    userId: string,
    userRole?: string // New: Pass user role for filtering
): Promise<Announcement[]> {
    const q = query(
        collection(db, 'announcements'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Announcement));

    // Filter: visible to user AND not dismissed by user
    return all.filter(
        (a: Announcement) =>
            !a.dismissedBy?.includes(userId) &&
            (
                a.targetType === 'all' ||
                a.targetUserIds?.includes(userId) ||
                (a.targetRoles && userRole && (
                    a.targetRoles.includes('all') ||
                    a.targetRoles.includes(userRole)
                )) ||
                (a.type !== 'notification' && a.createdBy === userId)
            )
    );
}

// ─── Unread count ──────────────────────────────────────
export async function getUnreadCount(
    companyId: string,
    userId: string,
    userRole?: string
): Promise<number> {
    const announcements = await getCompanyAnnouncements(companyId, userId, userRole);
    return announcements.filter((a) => !a.readBy?.includes(userId)).length;
}

// ─── Real-time Unread count Subscription ──────────────
export function subscribeToUnreadCount(
    companyId: string,
    userId: string,
    userRole: string | undefined,
    onUpdate: (count: number) => void
): () => void {
    const q = query(
        collection(db, 'announcements'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const all = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Announcement));

        // Apply the same visibility logic as getCompanyAnnouncements
        const visible = all.filter(
            (a: Announcement) =>
                !a.dismissedBy?.includes(userId) &&
                (
                    a.targetType === 'all' ||
                    a.targetUserIds?.includes(userId) ||
                    (a.targetRoles && userRole && (
                        a.targetRoles.includes('all') ||
                        a.targetRoles.includes(userRole)
                    )) ||
                    (a.type !== 'notification' && a.createdBy === userId)
                )
        );

        const unreadCount = visible.filter((a: Announcement) => !a.readBy?.includes(userId)).length;
        onUpdate(unreadCount);
    }, (error) => {
        console.error('Error listening to unread count:', error);
        onUpdate(0);
    });

    return unsubscribe;
}

// ─── Mark as read ──────────────────────────────────────
export async function markAsRead(
    announcementId: string,
    userId: string
): Promise<void> {
    await updateDoc(doc(db, 'announcements', announcementId), {
        readBy: arrayUnion(userId),
    });
}

// ─── Dismiss (per-user, doesn't delete for others) ─────
export async function dismissAnnouncement(
    announcementId: string,
    userId: string
): Promise<void> {
    await updateDoc(doc(db, 'announcements', announcementId), {
        dismissedBy: arrayUnion(userId),
    });
}

// ─── Get by ID ─────────────────────────────────────────
export async function getAnnouncementById(announcementId: string): Promise<Announcement | null> {
    const snap = await getDoc(doc(db, 'announcements', announcementId));
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Announcement;
    }
    return null;
}
