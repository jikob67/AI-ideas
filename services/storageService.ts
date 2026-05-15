import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

class StorageService {
    async uploadFile(path: string, blob: Blob): Promise<string> {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, blob);
        return getDownloadURL(snapshot.ref);
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
        const storageRef = ref(storage, `blobs/${id}`);
        const snapshot = await uploadBytes(storageRef, blob);
        return getDownloadURL(snapshot.ref);
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
}

export const storageService = new StorageService();

// Export as functions for compatibility
export const saveBlob = (id: string, blob: Blob) => storageService.saveBlob(id, blob);
export const getBlob = (id: string) => storageService.getBlob(id);
export const deleteBlob = (id: string) => storageService.deleteBlob(id);
