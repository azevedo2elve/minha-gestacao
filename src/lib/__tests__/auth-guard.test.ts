import { getRouteRedirect } from '../auth-guard';
import { Profile } from '@/types/database';

describe('RBAC Route Guard & First-Access Protection (Feature 01 Acceptance Criteria)', () => {
  const mockDoulaProfile: Profile = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'DOULA',
    full_name: 'Helena Ramos',
    phone: '(11) 98765-4321',
    avatar_url: null,
    must_change_password: false,
    doula_status: 'ONLINE',
    doula_status_message: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const mockPregnantFirstAccessProfile: Profile = {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'PREGNANT',
    full_name: 'Camila Santos',
    phone: '(11) 91234-5678',
    avatar_url: null,
    must_change_password: true,
    doula_status: 'ONLINE',
    doula_status_message: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const mockPregnantActiveProfile: Profile = {
    id: '44444444-4444-4444-4444-444444444444',
    role: 'PREGNANT',
    full_name: 'Maria Clara',
    phone: '(11) 99876-5432',
    avatar_url: null,
    must_change_password: false,
    doula_status: 'ONLINE',
    doula_status_message: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  describe('1. Unauthenticated Users', () => {
    it('redirects to login when accessing doula dashboard', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: false,
        profile: null,
        segments: ['(doula)', 'dashboard'],
      });
      expect(redirect).toBe('/(auth)/login');
    });

    it('redirects to login when accessing pregnant home', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: false,
        profile: null,
        segments: ['(pregnant)', 'home'],
      });
      expect(redirect).toBe('/(auth)/login');
    });

    it('redirects to login when accessing change-password screen', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: false,
        profile: null,
        segments: ['(auth)', 'change-password'],
      });
      expect(redirect).toBe('/(auth)/login');
    });

    it('allows access to login page', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: false,
        profile: null,
        segments: ['(auth)', 'login'],
      });
      expect(redirect).toBeNull();
    });

    it('allows access to index / landing page', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: false,
        profile: null,
        segments: ['index'],
      });
      expect(redirect).toBeNull();
    });
  });

  describe('2. Authenticated DOULA (Admin/Especialista)', () => {
    it('allows access to doula screens', () => {
      const redirectDashboard = getRouteRedirect({
        isAuthenticated: true,
        profile: mockDoulaProfile,
        segments: ['(doula)', 'dashboard'],
      });
      expect(redirectDashboard).toBeNull();

      const redirectAnamnesis = getRouteRedirect({
        isAuthenticated: true,
        profile: mockDoulaProfile,
        segments: ['(doula)', 'new-anamnesis'],
      });
      expect(redirectAnamnesis).toBeNull();
    });

    it('blocks DOULA from accessing pregnant routes (cross-route block)', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockDoulaProfile,
        segments: ['(pregnant)', 'home'],
      });
      expect(redirect).toBe('/(doula)/dashboard');
    });

    it('redirects DOULA away from auth/login to dashboard', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockDoulaProfile,
        segments: ['(auth)', 'login'],
      });
      expect(redirect).toBe('/(doula)/dashboard');
    });

    it('redirects DOULA away from index to dashboard', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockDoulaProfile,
        segments: ['index'],
      });
      expect(redirect).toBe('/(doula)/dashboard');
    });
  });

  describe('3. Authenticated PREGNANT (First-Access: must_change_password = true)', () => {
    it('forces PREGNANT on first-access to change-password when trying to view home', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantFirstAccessProfile,
        segments: ['(pregnant)', 'home'],
      });
      expect(redirect).toBe('/(auth)/change-password');
    });

    it('forces PREGNANT on first-access to change-password when trying to access doula routes', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantFirstAccessProfile,
        segments: ['(doula)', 'dashboard'],
      });
      expect(redirect).toBe('/(auth)/change-password');
    });

    it('allows PREGNANT on first-access to view change-password screen', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantFirstAccessProfile,
        segments: ['(auth)', 'change-password'],
      });
      expect(redirect).toBeNull();
    });
  });

  describe('4. Authenticated PREGNANT (Active: must_change_password = false)', () => {
    it('allows access to pregnant app tabs', () => {
      const redirectHome = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantActiveProfile,
        segments: ['(pregnant)', 'home'],
      });
      expect(redirectHome).toBeNull();

      const redirectDiary = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantActiveProfile,
        segments: ['(pregnant)', 'diary'],
      });
      expect(redirectDiary).toBeNull();
    });

    it('blocks PREGNANT from accessing doula routes (cross-route block)', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantActiveProfile,
        segments: ['(doula)', 'dashboard'],
      });
      expect(redirect).toBe('/(pregnant)/home');
    });

    it('redirects PREGNANT away from auth/login to home', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantActiveProfile,
        segments: ['(auth)', 'login'],
      });
      expect(redirect).toBe('/(pregnant)/home');
    });

    it('redirects PREGNANT away from change-password once completed', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantActiveProfile,
        segments: ['(auth)', 'change-password'],
      });
      expect(redirect).toBe('/(pregnant)/home');
    });

    it('redirects PREGNANT away from index to home', () => {
      const redirect = getRouteRedirect({
        isAuthenticated: true,
        profile: mockPregnantActiveProfile,
        segments: ['index'],
      });
      expect(redirect).toBe('/(pregnant)/home');
    });
  });
});

