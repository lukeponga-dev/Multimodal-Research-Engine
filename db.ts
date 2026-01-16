
import { DocumentItem, ChatMessage } from './types';

const DB_NAME = 'NexusDB';
const DB_VERSION = 1;
const DOCS_STORE = 'documents';
const MSGS_STORE = 'messages';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject("IndexedDB not supported");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DOCS_STORE)) {
        db.createObjectStore(DOCS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MSGS_STORE)) {
        db.createObjectStore(MSGS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const db = {
  async getAllDocuments(): Promise<DocumentItem[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCS_STORE, 'readonly');
        const store = transaction.objectStore(DOCS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("DB Error (Docs):", e);
      return [];
    }
  },

  async addDocument(doc: DocumentItem): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE, 'readwrite');
      const store = transaction.objectStore(DOCS_STORE);
      const request = store.put(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async removeDocument(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(DOCS_STORE, 'readwrite');
      const store = transaction.objectStore(DOCS_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllMessages(): Promise<ChatMessage[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(MSGS_STORE, 'readonly');
        const store = transaction.objectStore(MSGS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("DB Error (Msgs):", e);
      return [];
    }
  },

  async addMessage(msg: ChatMessage): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MSGS_STORE, 'readwrite');
      const store = transaction.objectStore(MSGS_STORE);
      const request = store.put(msg);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearMessages(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MSGS_STORE, 'readwrite');
      const store = transaction.objectStore(MSGS_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
