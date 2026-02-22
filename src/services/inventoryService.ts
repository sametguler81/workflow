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
    deleteField,
} from '@react-native-firebase/firestore';

const db = getFirestore();

// ─── Types ─────────────────────────────────────────────────

export type ItemCategory = 'elektronik' | 'araç' | 'mobilya' | 'ekipman' | 'diger';
export type ItemStatus = 'available' | 'assigned' | 'maintenance' | 'retired';
export type AssignmentStatus = 'active' | 'returned';

export interface InventoryItem {
    id: string;
    companyId: string;
    name: string;
    category: ItemCategory;
    status: ItemStatus;
    purchaseDate?: string;
    purchasePrice?: number;
    notes?: string;
    attributes?: Record<string, string>; // category-specific fields (plate, brand, model, serialNumber, etc.)
    createdAt: string;
    createdBy: string;
}

export interface Assignment {
    id: string;
    companyId: string;
    itemId: string;
    itemName: string;
    itemCategory: ItemCategory;
    assignedTo: string;
    assignedToName: string;
    assignedBy: string;
    assignedByName: string;
    assignedAt: string;
    returnedAt?: string | null;
    status: AssignmentStatus;
    notes?: string;
    returnNotes?: string;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
    elektronik: 'Elektronik',
    araç: 'Araç',
    mobilya: 'Mobilya',
    ekipman: 'Ekipman',
    diger: 'Diğer',
};

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
    elektronik: 'laptop-outline',
    araç: 'car-outline',
    mobilya: 'bed-outline',
    ekipman: 'construct-outline',
    diger: 'cube-outline',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
    available: 'Müsait',
    assigned: 'Zimmetli',
    maintenance: 'Bakımda',
    retired: 'Hizmet Dışı',
};

export const STATUS_COLORS: Record<ItemStatus, string> = {
    available: '#059669',
    assigned: '#1E40AF',
    maintenance: '#D97706',
    retired: '#6B7280',
};

// ─── Inventory Item CRUD ───────────────────────────────────

export async function createInventoryItem(
    data: Omit<InventoryItem, 'id' | 'status' | 'createdAt'>
): Promise<string> {
    const ref = await addDoc(collection(db, 'inventoryItems'), {
        ...data,
        status: 'available',
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}

export async function createItemWithAssignments(
    itemData: Omit<InventoryItem, 'id' | 'status' | 'createdAt'>,
    assignees: { uid: string; displayName: string }[],
    assignedBy: string,
    assignedByName: string,
    notes?: string
): Promise<string> {
    // 1. Clean itemData to remove undefined values (Firestore throws error otherwise)
    const cleanedItemData: any = {};
    Object.entries(itemData).forEach(([key, value]) => {
        if (value !== undefined) {
            cleanedItemData[key] = value;
        }
    });

    // 2. Create item as assigned
    const itemRef = await addDoc(collection(db, 'inventoryItems'), {
        ...cleanedItemData,
        status: assignees.length > 0 ? 'assigned' : 'available',
        createdAt: new Date().toISOString(),
    });
    const itemId = itemRef.id;

    // 2. Create assignments if any
    if (assignees.length > 0) {
        const promises = assignees.map(user =>
            addDoc(collection(db, 'assignments'), {
                companyId: itemData.companyId,
                itemId,
                itemName: itemData.name,
                itemCategory: itemData.category,
                assignedTo: user.uid,
                assignedToName: user.displayName,
                assignedBy,
                assignedByName,
                assignedAt: new Date().toISOString(),
                returnedAt: null,
                status: 'active',
                notes: notes || '',
            })
        );
        await Promise.all(promises);
    }

    return itemId;
}

export async function getInventoryItems(companyId: string): Promise<InventoryItem[]> {
    const q = query(
        collection(db, 'inventoryItems'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as InventoryItem));
}

export async function getInventoryItemById(itemId: string): Promise<InventoryItem | null> {
    const snap = await getDoc(doc(db, 'inventoryItems', itemId));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as InventoryItem;
    return null;
}

export async function updateInventoryItem(
    itemId: string,
    data: Partial<Omit<InventoryItem, 'id' | 'companyId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
    const cleanedData: any = {};
    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined) {
            cleanedData[key] = deleteField();
        } else {
            cleanedData[key] = value;
        }
    });

    await updateDoc(doc(db, 'inventoryItems', itemId), {
        ...cleanedData,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'inventoryItems', itemId));
}

// ─── Assignment Operations ─────────────────────────────────

export async function assignItem(
    itemId: string,
    itemName: string,
    itemCategory: ItemCategory,
    companyId: string,
    assignedTo: string,
    assignedToName: string,
    assignedBy: string,
    assignedByName: string,
    notes?: string
): Promise<string> {
    // Create assignment record
    const ref = await addDoc(collection(db, 'assignments'), {
        companyId,
        itemId,
        itemName,
        itemCategory,
        assignedTo,
        assignedToName,
        assignedBy,
        assignedByName,
        assignedAt: new Date().toISOString(),
        returnedAt: null,
        status: 'active',
        notes: notes || '',
    });

    // Update item status
    await updateDoc(doc(db, 'inventoryItems', itemId), {
        status: 'assigned',
        updatedAt: new Date().toISOString(),
    });

    return ref.id;
}

export async function returnItem(
    assignmentId: string,
    itemId: string,
    returnNotes?: string
): Promise<void> {
    // Close assignment
    await updateDoc(doc(db, 'assignments', assignmentId), {
        returnedAt: new Date().toISOString(),
        status: 'returned',
        returnNotes: returnNotes || '',
    });

    // Update item status back to available
    await updateDoc(doc(db, 'inventoryItems', itemId), {
        status: 'available',
        updatedAt: new Date().toISOString(),
    });
}

// ─── Queries ───────────────────────────────────────────────

export async function getActiveAssignments(companyId: string): Promise<Assignment[]> {
    const q = query(
        collection(db, 'assignments'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Assignment));
    return results.sort((a: Assignment, b: Assignment) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
}

export async function getUserAssignments(
    userId: string,
    companyId: string
): Promise<Assignment[]> {
    const q = query(
        collection(db, 'assignments'),
        where('companyId', '==', companyId),
        where('assignedTo', '==', userId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Assignment));
    return results.sort((a: Assignment, b: Assignment) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
}

export async function getItemAssignmentHistory(itemId: string): Promise<Assignment[]> {
    const q = query(
        collection(db, 'assignments'),
        where('itemId', '==', itemId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Assignment));
    return results.sort((a: Assignment, b: Assignment) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
}

export async function getActiveAssignmentForItem(itemId: string): Promise<Assignment | null> {
    const q = query(
        collection(db, 'assignments'),
        where('itemId', '==', itemId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Assignment;
}

export async function getActiveAssignmentsForItem(itemId: string): Promise<Assignment[]> {
    const q = query(
        collection(db, 'assignments'),
        where('itemId', '==', itemId),
        where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Assignment));
}
