import { getStorage, ref, putFile, getDownloadURL, getMetadata } from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system';

/**
 * Gets the size of a local file in bytes.
 * Returns 0 if the file cannot be stat'd.
 */
export async function getFileSizeBytes(localFileUri: string): Promise<number> {
    try {
        const cleanUri = localFileUri.startsWith('file://')
            ? localFileUri
            : `file://${localFileUri}`;
        const info = await (FileSystem.getInfoAsync as any)(cleanUri, { size: true });
        if (info.exists && 'size' in info) {
            return (info as any).size as number;
        }
        return 0;
    } catch (e) {
        console.warn('getFileSizeBytes failed:', e);
        return 0;
    }
}

export interface UploadResult {
    downloadURL: string;
    sizeBytes: number;
}

/**
 * Uploads a local file (e.g., from ImagePicker or DocumentPicker) to Firebase Storage
 * and returns the download URL along with the real file size in bytes.
 *
 * @param localFileUri The local URI of the file (starts with file://)
 * @param destinationFolder The folder path in Storage (e.g., 'expenses/userId/')
 * @returns UploadResult with downloadURL and sizeBytes
 */
export async function uploadFileToStorage(
    localFileUri: string,
    destinationFolder: string
): Promise<UploadResult> {
    try {
        // Measure real file size BEFORE upload
        const sizeBytes = await getFileSizeBytes(localFileUri);

        // Extract filename from URI or generate a unique name
        const filename =
            localFileUri.substring(localFileUri.lastIndexOf('/') + 1) ||
            `file_${Date.now()}`;
        const uniqueFilename = `${Date.now()}_${filename}`;
        const destinationPath = `${destinationFolder}/${uniqueFilename}`;

        const storageInstance = getStorage();
        const reference = ref(storageInstance, destinationPath);

        // RNFB usually handles 'file://' well, but strip for putFile compatibility
        let uploadUri = localFileUri;
        if (uploadUri.startsWith('file://')) {
            uploadUri = uploadUri.replace('file://', '');
        }

        const task = putFile(reference, uploadUri);
        await task;

        // Get the download URL only after task is fully completed
        const downloadURL = await getDownloadURL(reference);

        return { downloadURL, sizeBytes };
    } catch (error) {
        console.error('Storage upload error:', error);
        throw new Error('Dosya yüklenirken bir hata oluştu.');
    }
}
