import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from '@react-native-firebase/firestore';

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
 * Belirli kullanıcılara Push Bildirimi Gönderir
 */
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    if (!expoPushToken) return;

    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.error('Push bildirimi gönderilemedi:', error);
    }
}

/**
 * Gönderilen rollere sahip firma içi tüm kullanıcılara bildirim atar
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

        const pushPromises = usersSnap.docs.map((doc: any) => {
            const userData = doc.data();
            if (userData.expoPushToken) {
                return sendPushNotification(userData.expoPushToken, title, body, data);
            }
            return null;
        });

        await Promise.all(pushPromises.filter((p: any) => p !== null));
    } catch (error) {
        console.error('Role göre bildirim gönderilirken hata:', error);
    }
}
