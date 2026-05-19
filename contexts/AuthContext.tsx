
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User as AppUser, Project, PlanId, AuthContextType } from '../types';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

// --- START: Blob URL Resolver ---
export const resolveBlobUrlToDataUrl = async (url: string): Promise<string> => {
    if (!url || !url.startsWith('blob:')) {
      return url;
    }
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
      }
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
               resolve(reader.result);
          } else {
               reject(new Error('FileReader did not return a string.'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to resolve blob URL:', error);
      return url; // Fallback to the original URL on error
    }
  };
// --- END: Blob URL Resolver ---

// --- START: Safe LocalStorage Helpers ---
const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`Failed to get item "${key}" from localStorage:`, e);
        return null;
    }
};

const safeSetItem = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`Failed to set item "${key}" in localStorage:`, e);
    }
};

const safeRemoveItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn(`Failed to remove item "${key}" from localStorage:`, e);
    }
};

const safeJsonParse = <T,>(jsonString: string | null, fallback: T): T => {
    if (jsonString === null) {
        return fallback;
    }
    try {
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.warn(`Failed to parse JSON from localStorage:`, e);
        return fallback;
    }
};
// --- END: Safe LocalStorage Helpers ---

// --- START: Payment Service Implementation ---
export interface SubscriptionRecord {
    subscriptionId: string;
    userId: string;
    planId: PlanId;
    walletAddress: string;
    txHash: string | null;
    chainId: string | null;
    amount: number;
    currency: string;
    confirmations: number;
    status: 'pending' | 'confirmed' | 'failed' | 'error';
    createdAt: string;
}

interface AuditEvent {
    ts: string;
    eventType: string;
    details: any;
}

const LEDGER_KEY = 'paymentLedger';
const AUDIT_KEY = 'paymentAuditLog';

const getLedger = (): Record<string, SubscriptionRecord> => {
    return safeJsonParse<Record<string, SubscriptionRecord>>(safeGetItem(LEDGER_KEY), {});
};
const saveLedger = (ledger: Record<string, SubscriptionRecord>) => {
    safeSetItem(LEDGER_KEY, JSON.stringify(ledger));
};

const getAuditLog = (): Record<string, AuditEvent[]> => {
    return safeJsonParse<Record<string, AuditEvent[]>>(safeGetItem(AUDIT_KEY), {});
};
const saveAuditLog = (log: Record<string, AuditEvent[]>) => {
    safeSetItem(AUDIT_KEY, JSON.stringify(log));
};

const logEvent = (subscriptionId: string, eventType: string, details: any) => {
    const auditLog = getAuditLog();
    if (!auditLog[subscriptionId]) {
        auditLog[subscriptionId] = [];
    }
    auditLog[subscriptionId].push({ ts: new Date().toISOString(), eventType, details });
    saveAuditLog(auditLog);
};

const recordPaymentAttempt = async (
    userId: string,
    planId: PlanId,
    walletAddress: string,
    amount: number,
    currency: string
): Promise<SubscriptionRecord> => {
    const subscriptionId = `sub_${Date.now()}`;
    const record: SubscriptionRecord = {
        subscriptionId,
        userId,
        planId,
        walletAddress,
        txHash: null,
        chainId: null,
        amount,
        currency,
        confirmations: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    const ledger = getLedger();
    ledger[subscriptionId] = record;
    saveLedger(ledger);
    logEvent(subscriptionId, 'attempt_created', { planId, amount, currency });
    
    return record;
};

const verifyTransactionOnChain = async (
    txHash: string
): Promise<{ status: 'pending' | 'confirmed' | 'failed' | 'not_found'; confirmations: number }> => {
    await new Promise(res => setTimeout(res, 3000)); // Simulate network latency
    const trimmedHash = txHash.trim().toLowerCase();
    if (!trimmedHash || trimmedHash.length < 10) return { status: 'not_found', confirmations: 0 };
    if (trimmedHash.includes('fail')) return { status: 'failed', confirmations: 1 };
    if (trimmedHash.includes('pending')) return { status: 'pending', confirmations: 2 }; 
    if (trimmedHash.includes('valid')) return { status: 'confirmed', confirmations: 12 };
    if (trimmedHash.startsWith('0x') && trimmedHash.length > 60) return { status: 'confirmed', confirmations: 15 };
    return { status: 'not_found', confirmations: 0 };
};

const handlePaymentVerification = async (
    subscriptionId: string,
    txHash: string
): Promise<SubscriptionRecord> => {
    const ledger = getLedger();
    const record = ledger[subscriptionId];
    if (!record) {
        logEvent(subscriptionId, 'verification_error', { error: 'Subscription record not found.' });
        throw new Error('Subscription record not found.');
    }
    logEvent(subscriptionId, 'verification_started', { txHash });
    record.txHash = txHash;
    const verification = await verifyTransactionOnChain(txHash);
    record.confirmations = verification.confirmations;
    switch (verification.status) {
        case 'confirmed':
            record.status = 'confirmed';
            logEvent(subscriptionId, 'verification_success', { confirmations: verification.confirmations });
            break;
        case 'pending':
            record.status = 'pending';
            logEvent(subscriptionId, 'verification_pending', { confirmations: verification.confirmations });
            break;
        case 'failed':
            record.status = 'failed';
            logEvent(subscriptionId, 'verification_failed', { reason: 'Transaction failed on-chain' });
            break;
        case 'not_found':
            record.status = 'failed';
            logEvent(subscriptionId, 'verification_failed', { reason: 'Transaction not found' });
            break;
        default:
             record.status = 'error';
             logEvent(subscriptionId, 'verification_error', { reason: 'Unknown verification status' });
    }
    ledger[subscriptionId] = record;
    saveLedger(ledger);
    return record;
};

export const paymentService = {
    recordPaymentAttempt,
    handlePaymentVerification,
};
// --- END: Payment Service Implementation ---

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }

      if (firebaseUser) {
        // Initial mapping from Firebase User
        const baseAppUser: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          username: firebaseUser.displayName || firebaseUser.email || '', 
          points: 0,
          plan: 'free',
          isNewUser: true,
          isBanned: false,
          warnings: 0,
          referralCode: '',
          referralCodeUsed: false
        };

        // Listen for real-time updates from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUser({
              ...baseAppUser,
              ...data,
              email: firebaseUser.email || data.email || '',
            } as AppUser);
          } else {
            // Create user doc if it doesn't exist
            try {
              await setDoc(userDocRef, baseAppUser);
              setCurrentUser(baseAppUser);
            } catch (err) {
              console.error("Failed to create user document:", err);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore snapshot error:", error);
          setCurrentUser(baseAppUser);
          setLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const updateUser = async (updates: Partial<AppUser>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updates, { merge: true });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const upgradePlan = async (plan: PlanId) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { plan }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, updateUser, upgradePlan }}>
      {children}
    </AuthContext.Provider>
  );
};
