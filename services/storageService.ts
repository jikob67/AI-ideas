import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

class StorageService {
    async uploadFile(path: string, blob: Blob): Promise<string> {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, blob);
        return getDownloadURL(snapshot.ref);
    }

    async uploadText(path: string, text: string, mimeType: string = 'text/plain'): Promise<string> {
        const blob = new Blob([text], { type: mimeType });
        return this.uploadFile(path, blob);
    }

    async uploadBase64(path: string, base64: string, mimeType: string): Promise<string> {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        return this.uploadFile(path, blob);
    }

    async deleteFile(path: string): Promise<void> {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    }

    // Compatibility methods for existing code
    async saveBlob(id: string, blob: Blob): Promise<string> {
        try {
            const storageRef = ref(storage, `blobs/${id}`);
            const snapshot = await uploadBytes(storageRef, blob);
            return await getDownloadURL(snapshot.ref);
        } catch (error: any) {
            console.error('[StorageService] Save blob error:', error);
            if (error.code === 'storage/retry-limit-exceeded') {
                throw new Error('فشل الاتصال بخدمة التخزين. يرجى التأكد من استقرار الإنترنت وحاول مرة أخرى.');
            }
            if (error.code === 'storage/unauthorized') {
                throw new Error('ليس لديك صلاحية لرفع الملفات. يرجى تسجيل الدخول.');
            }
            throw new Error(`فشل رفع الملف: ${error.message || error.code}`);
        }
    }

    async getBlob(id: string): Promise<Blob | null> {
        try {
            const url = await getDownloadURL(ref(storage, `blobs/${id}`));
            const response = await fetch(url);
            return await response.blob();
        } catch (e) {
            return null;
        }
    }

    async deleteBlob(id: string): Promise<void> {
        try {
            const storageRef = ref(storage, `blobs/${id}`);
            await deleteObject(storageRef);
        } catch (e) {}
    }

    async downloadText(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (e) {
            console.error('[StorageService] Error downloading text:', e);
            return '';
        }
    }
}

export const storageService = new StorageService();

// Export as functions for compatibility
export const saveBlob = (id: string, blob: Blob) => storageService.saveBlob(id, blob);
export const getBlob = (id: string) => storageService.getBlob(id);
export const deleteBlob = (id: string) => storageService.deleteBlob(id);
