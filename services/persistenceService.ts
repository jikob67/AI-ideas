import { 
    doc, 
    setDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    deleteDoc, 
    writeBatch,
    serverTimestamp,
    increment,
    getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Project, ProjectFile, Message } from '../types';
import { storageService } from './storageService';

const MAX_PAYLOAD_SIZE = 700 * 1024; // 700KB

class PersistenceService {
    private calculateSize(data: any): number {
        const str = JSON.stringify(data);
        return new Blob([str]).size;
    }

    private logPayloadSize(path: string, size: number) {
        console.log(`[PersistenceService] Target: ${path}, Size: ${(size / 1024).toFixed(2)} KB`);
    }

    private checkSize(data: any, path: string) {
        const size = this.calculateSize(data);
        this.logPayloadSize(path, size);
        if (size > MAX_PAYLOAD_SIZE) {
            throw new Error(`Payload to ${path} exceeds 700KB limit (${(size / 1024).toFixed(2)} KB). Write rejected.`);
        }
    }

    async saveProjectMetadata(project: Project): Promise<void> {
        const { id, ...metadata } = project;
        // Ensure we don't save files or messages in metadata
        const cleanMetadata = { ...metadata } as any;
        delete cleanMetadata.files;
        delete cleanMetadata.builderChat;
        delete cleanMetadata.marketingAssets;
        delete cleanMetadata.marketingSuggestions;

        this.checkSize(cleanMetadata, `projects/${id}`);

        try {
            await setDoc(doc(db, 'projects', id), {
                ...cleanMetadata,
                updatedAt: Date.now()
            }, { merge: true });
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `projects/${id}`);
        }
    }

    async saveFile(projectId: string, file: ProjectFile): Promise<string> {
        const fileId = file.name.replace(/\//g, '_'); // Safe ID
        const filePath = `projects/${projectId}/files/${fileId}`;
        
        let storageUrl = '';
        let content = file.content;

        // If content is huge, move to storage
        if (this.calculateSize(content) > 500 * 1024) { // > 500KB
            const storagePath = `projects/${projectId}/files/${file.name}`;
            storageUrl = await storageService.uploadBase64(storagePath, btoa(content), 'text/plain');
            content = ''; // Clear content if stored in Storage
        }

        const fileData = {
            ...file,
            content,
            storageUrl,
            projectId,
            updatedAt: Date.now()
        };

        this.checkSize(fileData, filePath);

        try {
            await setDoc(doc(db, 'projects', projectId, 'files', fileId), fileData);
            // Increment file count in project
            await updateDoc(doc(db, 'projects', projectId), {
                fileCount: increment(1),
                updatedAt: Date.now()
            });
            return fileId;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, filePath);
            return '';
        }
    }

    async saveMessage(projectId: string, message: Message): Promise<string> {
        const msgPath = `projects/${projectId}/messages/${message.id}`;
        
        const messageData = {
            ...message,
            projectId,
            timestamp: Date.now()
        };

        this.checkSize(messageData, msgPath);

        try {
            const docRef = await addDoc(collection(db, 'projects', projectId, 'messages'), messageData);
            await updateDoc(doc(db, 'projects', projectId), {
                messageCount: increment(1),
                updatedAt: Date.now()
            });
            return docRef.id;
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, msgPath);
            return '';
        }
    }

    async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
        try {
            const q = query(collection(db, 'projects', projectId, 'files'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as ProjectFile);
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, `projects/${projectId}/files`);
            return [];
        }
    }

    async getProjectMessages(projectId: string): Promise<Message[]> {
        try {
            const q = query(collection(db, 'projects', projectId, 'messages'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data() as Message);
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, `projects/${projectId}/messages`);
            return [];
        }
    }

    async fullProjectSave(project: Project, files: ProjectFile[], messages: Message[]): Promise<void> {
        await this.saveProjectMetadata(project);
        
        // Save files sequentially or in batches if needed, but for simplicity:
        for (const file of files) {
            await this.saveFile(project.id, file);
        }

        for (const msg of messages) {
            await this.saveMessage(project.id, msg);
        }
    }
}

export const persistenceService = new PersistenceService();
