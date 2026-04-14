import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (onAuthStateChanged as any).mockImplementation((auth: any, callback: any) => {
      callback(null);
      return vi.fn();
    });
  });

  it('should throw error when used outside of AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should provide login, logout, and profile', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loginWithLinkedIn).toBeDefined();
    expect(result.current.logout).toBeDefined();
    expect(result.current.profile).toBeNull();
  });

  it('should sync profile when user logs in', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    (onAuthStateChanged as any).mockImplementation((auth: any, callback: any) => {
      callback(mockUser);
      return vi.fn();
    });
    (getDoc as any).mockResolvedValue({ exists: () => false });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    await act(async () => {
      renderHook(() => useAuth(), { wrapper });
    });

    expect(doc).toHaveBeenCalled();
    expect(getDoc).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(undefined, {
      email: 'test@example.com',
      subscriptionStatus: 'none',
    });
  });
});
