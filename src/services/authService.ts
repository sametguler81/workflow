import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from '@react-native-firebase/firestore';

export type User = FirebaseAuthTypes.User;

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'personel' | 'idari' | 'muhasebe' | 'admin';
    companyId: string;
    companyName?: string;
    createdAt: string;
}

const authInstance = getAuth();
const db = getFirestore();

export async function registerUser(
    email: string,
    password: string,
    displayName: string,
    companyName: string
): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(authInstance, email, password);
    const companyId = cred.user.uid + '_company';

    // Create company
    await setDoc(doc(db, 'companies', companyId), {
        name: companyName,
        ownerId: cred.user.uid,
        plan: 'free',
        userLimit: 5,
        createdAt: new Date().toISOString(),
    });

    // Create user profile
    const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        role: 'admin',
        companyId,
        companyName,
        createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), profile);
    return profile;
}

export async function loginUser(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(authInstance, email, password);
    return cred.user;
}

export async function logoutUser(): Promise<void> {
    await signOut(authInstance);
}

export async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(authInstance, email);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
        return snap.data() as UserProfile;
    }
    return null;
}

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(authInstance, callback);
}
