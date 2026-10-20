import { useAuthStore, MOCK_USERS } from '../useAuthStore';

// In-memory mock for AsyncStorage
const storageMock: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => {
    storageMock[key] = value;
  }),
  getItem: jest.fn(async (key: string) => {
    return storageMock[key] || null;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete storageMock[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  }),
}));

// Mock Supabase client & safeStorage
jest.mock('@/lib/supabase', () => ({
  safeStorage: {
    getItem: jest.fn(async (key: string) => storageMock[key] || null),
    setItem: jest.fn(async (key: string, value: string) => {
      storageMock[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete storageMock[key];
    }),
  },
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(async () => ({ data: { user: null, session: null }, error: new Error('Offline') })),
      signOut: jest.fn(async () => ({ error: null })),
      updateUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(async () => ({ data: null, error: null })),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('useAuthStore (Feature 01: Auth & RBAC)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
    await useAuthStore.getState().logout();
  });

  it('starts in unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  describe('Mock / Demo Logins & RBAC Profiles', () => {
    it('authenticates DOULA with Helena Ramos profile and correct permissions', async () => {
      await useAuthStore.getState().mockLogin('doula');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.profile?.role).toBe('DOULA');
      expect(state.profile?.full_name).toBe('Helena Ramos');
      expect(state.profile?.must_change_password).toBe(false);
      expect(state.user?.email).toBe('doula.helena@minhagestacao.app');
    });

    it('authenticates PREGNANT first-access with Camila Santos and must_change_password = true', async () => {
      await useAuthStore.getState().mockLogin('pregnantFirstAccess');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.profile?.role).toBe('PREGNANT');
      expect(state.profile?.full_name).toBe('Camila Santos');
      expect(state.profile?.must_change_password).toBe(true);
      expect(state.user?.email).toBe('camila.santos@exemplo.com');
    });

    it('authenticates PREGNANT active with Maria Clara and must_change_password = false', async () => {
      await useAuthStore.getState().mockLogin('pregnantActive');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.profile?.role).toBe('PREGNANT');
      expect(state.profile?.full_name).toBe('Maria Clara');
      expect(state.profile?.must_change_password).toBe(false);
    });
  });

  describe('Credentials login fallback', () => {
    it('successfully logs in doula with valid test credentials', async () => {
      const result = await useAuthStore.getState().login('doula.helena@minhagestacao.app', '123456');

      expect(result.success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.profile?.role).toBe('DOULA');
    });

    it('successfully logs in pregnant with first-access credentials', async () => {
      const result = await useAuthStore.getState().login('camila.santos@exemplo.com', '123456');

      expect(result.success).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.profile?.must_change_password).toBe(true);
    });

    it('rejects invalid credentials with humanized error', async () => {
      const result = await useAuthStore.getState().login('wrong@email.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('E-mail ou senha incorretos');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Password Change on First Access', () => {
    it('validates password length >= 6', async () => {
      await useAuthStore.getState().mockLogin('pregnantFirstAccess');

      const result = await useAuthStore.getState().changePassword('123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('mínimo 6 caracteres');
      expect(useAuthStore.getState().profile?.must_change_password).toBe(true);
    });

    it('updates must_change_password to false upon successful change', async () => {
      await useAuthStore.getState().mockLogin('pregnantFirstAccess');
      expect(useAuthStore.getState().profile?.must_change_password).toBe(true);

      const result = await useAuthStore.getState().changePassword('novaSenhaSegura2026!');
      expect(result.success).toBe(true);

      const state = useAuthStore.getState();
      expect(state.profile?.must_change_password).toBe(false);
    });
  });

  describe('Logout', () => {
    it('clears user, profile, and authentication status', async () => {
      await useAuthStore.getState().mockLogin('doula');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });
  });
});

