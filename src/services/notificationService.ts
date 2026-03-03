import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

const db = getFirestore();

// Bildirimlerin uygulamadayken nasıl görüneceğini ayarla
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Cihazdan Push İzni İster ve Token'ı Döndürür
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Bildirim izni alınamadı!');
            return null;
        }

        try {
            const tokenResponse = await Notifications.getExpoPushTokenAsync({
                // projectId: 'your-project-id' // Optional: Configure if using EAS Build
            });
            return tokenResponse.data;
        } catch (error) {
            console.error('Expo Push Token alınırken hata:', error);
            return null;
        }
    } else {
        console.log('Fiziksel bir cihazda çalışmalısınız (Push bildirimleri için)');
        return null;
    }
}

/**
 * Kullanıcının tokenını Firestore'da günceller
 */
export async function saveUserPushToken(uid: string, token: string | null) {
    if (!uid) return;
    try {
        await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
    } catch (error) {
        console.error('Token kaydedilemedi:', error);
    }
}

/**
 * Push Bildirimi Gönderir — Cloud Function Üzerinden
 * 
 * ✅ Güvenlik: Bildirimler artık sunucu tarafından gönderilir.
 * Client sadece hedef token'ları ve mesaj içeriğini Cloud Function'a iletir.
 */
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    if (!expoPushToken) return;

    try {
        const functions = getFunctions();
        const sendNotificationFn = httpsCallable(functions, 'sendNotification');

        await sendNotificationFn({
            targetTokens: [expoPushToken],
            title,
            body,
            data: data || {},
        });
    } catch (error) {
        console.error('Push bildirimi gönderilemedi:', error);
    }
}

/**
 * Gönderilen rollere sahip firma içi tüm kullanıcılara bildirim atar
 * 
 * ✅ Token'ları toplar ve Cloud Function'a tek seferde gönderir.
 */
export async function notifyRolesInCompany(
    companyId: string,
    rolesToNotify: string[],
    title: string,
    body: string,
    data?: any
) {
    try {
        const q = query(
            collection(db, 'users'),
            where('companyId', '==', companyId),
            where('role', 'in', rolesToNotify)
        );
        const usersSnap = await getDocs(q);

        // Tüm token'ları topla
        const tokens: string[] = [];
        usersSnap.docs.forEach((doc: any) => {
            const userData = doc.data();
            if (userData.expoPushToken) {
                tokens.push(userData.expoPushToken);
            }
        });

        if (tokens.length === 0) return;

        // Cloud Function ile gönder
        const functions = getFunctions();
        const sendNotificationFn = httpsCallable(functions, 'sendNotification');

        await sendNotificationFn({
            targetTokens: tokens,
            title,
            body,
            data: data || {},
        });
    } catch (error) {
        console.error('Role göre bildirim gönderilirken hata:', error);
    }
}
