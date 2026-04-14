import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock('firebase/auth', () => {
  const OAuthProvider = vi.fn().mockImplementation(function (this: any) {
    this.addScope = vi.fn().mockReturnThis();
    this.setCustomParameters = vi.fn().mockReturnThis();
  });

  if (typeof globalThis !== 'undefined') {
    (globalThis as any).OAuthProvider = OAuthProvider;
  }

  return {
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInWithPopup: vi.fn(),
    OAuthProvider,
    signOut: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  where: vi.fn(),
  query: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));
