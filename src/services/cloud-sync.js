import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from './firebase-service.js';

export class CloudSync {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.enabled = false;
    this.firestore = null;
    this.docRef = null;
    this.auth = null;
    this.pendingUpdates = new Map();
    this.flushTimeout = null;
    this.flushing = false;
    this.applyingRemoteUpdate = false;
    this.unsubscribe = null;
    this.currentUserId = null;

    this.initialize();
  }

  async initialize() {
    try {
      const services = await initializeFirebase();
      if (!services) {
        return;
      }

      const { firestore, auth } = services;
      this.firestore = firestore;
      this.auth = auth;

      onAuthStateChanged(auth, (user) => {
        this.handleAuthChange(user).catch((error) => {
          console.error('[CloudSync] Auth change handling failed', error);
        });
      });
    } catch (error) {
      console.warn('[CloudSync] Disabled - Firebase initialization failed.', error);
    }
  }

  subscribeToRemoteUpdates() {
    this.unsubscribe = onSnapshot(
      this.docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        this.applyRemoteData(snapshot.data());
      },
      (error) => {
        console.error('[CloudSync] Snapshot listener error', error);
      }
    );
  }

  applyRemoteData(data) {
    this.applyingRemoteUpdate = true;
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('_')) {
          return;
        }
        this.dataManager.setFromCloud(key, value);
      });
    } finally {
      this.applyingRemoteUpdate = false;
    }
  }

  queueUpdate(key, value) {
    if (this.applyingRemoteUpdate) {
      return;
    }

    const sanitizedValue = value === undefined ? null : value;
    this.pendingUpdates.set(key, sanitizedValue);
    if (this.enabled) {
      this.scheduleFlush();
    }
  }

  scheduleFlush() {
    if (this.flushTimeout !== null) {
      return;
    }
    this.flushTimeout = setTimeout(() => {
      this.flushTimeout = null;
      this.flushPendingUpdates();
    }, 300);
  }

  async flushPendingUpdates() {
    if (!this.enabled || this.pendingUpdates.size === 0 || this.flushing) {
      return;
    }

    this.flushing = true;
    const updates = Object.fromEntries(this.pendingUpdates.entries());
    this.pendingUpdates.clear();

    try {
      await setDoc(this.docRef, updates, { merge: true });
    } catch (error) {
      console.error('[CloudSync] Failed to sync data', error);
      Object.entries(updates).forEach(([key, value]) => {
        this.pendingUpdates.set(key, value);
      });
      if (!this.flushTimeout) {
        this.scheduleFlush();
      }
    } finally {
      this.flushing = false;
    }
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  async handleAuthChange(user) {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.enabled = false;
    this.currentUserId = user?.uid ?? null;

    if (!user) {
      this.docRef = null;
      return;
    }

    this.docRef = doc(this.firestore, 'lifeDashboard', user.uid);

    try {
      const snapshot = await getDoc(this.docRef);
      const exists = snapshot.exists();
      const data = exists ? snapshot.data() : {};

      if (!exists) {
        await setDoc(this.docRef, { _meta: { createdAt: serverTimestamp() } }, { merge: true });
        await this.pushAllLocalData();
      } else if (this.isDocEmpty(data)) {
        await this.pushAllLocalData();
      } else {
        this.applyRemoteData(data);
      }

      await setDoc(this.docRef, { _meta: { lastLogin: serverTimestamp() } }, { merge: true });

      this.enabled = true;
      this.subscribeToRemoteUpdates();
      this.flushPendingUpdates();
    } catch (error) {
      console.error('[CloudSync] Failed during auth transition', error);
    }
  }

  isDocEmpty(data) {
    return !Object.keys(data).some((key) => !key.startsWith('_'));
  }

  async pushAllLocalData() {
    if (!this.docRef) {
      return;
    }

    const payload = this.dataManager?.exportDataForSync?.();
    if (!payload || Object.keys(payload).length === 0) {
      return;
    }

    try {
      await setDoc(this.docRef, payload, { merge: true });
    } catch (error) {
      console.error('[CloudSync] Failed to push local data to Firestore', error);
    }
  }
}
