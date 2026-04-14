import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/hooks/useAuth');
vi.mock('next/navigation');

describe('ProtectedRoute', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (usePathname as any).mockReturnValue('/dashboard');
  });

  it('should show loading state', () => {
    (useAuth as any).mockReturnValue({ user: null, profile: null, loading: true });
    render(<ProtectedRoute><div>Children</div></ProtectedRoute>);
    expect(screen.getByRole('status', { hidden: true })).toBeDefined();
  });

  it('should redirect to login if no user', () => {
    (useAuth as any).mockReturnValue({ user: null, profile: null, loading: false });
    render(<ProtectedRoute><div>Children</div></ProtectedRoute>);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect to products if user is not subscribed', () => {
    (useAuth as any).mockReturnValue({ 
      user: { uid: '123' }, 
      profile: { subscriptionStatus: 'none' }, 
      loading: false 
    });
    render(<ProtectedRoute><div>Children</div></ProtectedRoute>);
    expect(mockPush).toHaveBeenCalledWith('/products');
  });

  it('should render children if user is subscribed', () => {
    (useAuth as any).mockReturnValue({ 
      user: { uid: '123' }, 
      profile: { subscriptionStatus: 'active' }, 
      loading: false 
    });
    render(<ProtectedRoute><div>Children</div></ProtectedRoute>);
    expect(screen.getByText('Children')).toBeDefined();
  });
});
