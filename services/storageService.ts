import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

class StorageService {
    async uploadFile(path: string, blob: Blob): Promise<string> {
        const storageRef = ref(storage, path);
        const metadata = { contentType: blob.type || 'application/octet-stream' };
        const snapshot = await uploadBytes(storageRef, blob, metadata);
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
            const metadata = { contentType: blob.type || 'application/octet-stream' };
            
            // Timeout after 3.5 seconds to avoid freezing the UI if Firebase Storage is unconfigured or blocked
            const uploadPromise = uploadBytes(storageRef, blob, metadata);
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout')), 3.5 * 1000)
            );
            
            const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
            return await getDownloadURL(snapshot.ref);
        } catch (error: any) {
            console.warn('[StorageService] Firebase Storage upload failed, falling back to local Object URL:', error);
            // Bulletproof local fallback using browser Object URL so that the pipeline can finish and the user can still run/interact with the app!
            return URL.createObjectURL(blob);
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
