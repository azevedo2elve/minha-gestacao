import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase, safeStorage } from '@/lib/supabase';
import { Profile, UserRole, DoulaAvailability } from '@/types/database';

const MOCK_STORAGE_KEY = '@minha_gestacao:mock_session';

export const MOCK_USERS = {
  doula: {
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'doula.helena@minhagestacao.app',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'DOULA', full_name: 'Helena Ramos' },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00.000Z',
    } as unknown as User,
    profile: {
      id: '11111111-1111-1111-1111-111111111111',
      role: 'DOULA' as UserRole,
      full_name: 'Helena Ramos',
      phone: '(11) 98765-4321',
      avatar_url: null,
      must_change_password: false,
      doula_status: 'ONLINE' as DoulaAvailability,
      doula_status_message: 'Disponível para consultas e dúvidas',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    } as Profile,
  },
  pregnantFirstAccess: {
    user: {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'camila.santos@exemplo.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'PREGNANT', full_name: 'Camila Santos', must_change_password: true },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00.000Z',
    } as unknown as User,
    profile: {
      id: '22222222-2222-2222-2222-222222222222',
      role: 'PREGNANT' as UserRole,
      full_name: 'Camila Santos',
      phone: '(11) 91234-5678',
      avatar_url: null,
      must_change_password: true,
      doula_status: 'ONLINE' as DoulaAvailability,
      doula_status_message: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    } as Profile,
  },
  pregnantActive: {
    user: {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'maria.clara@exemplo.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'PREGNANT', full_name: 'Maria Clara', must_change_password: false },
      aud: 'authenticated',
      created_at: '2026-01-01T00:00:00.000Z',
    } as unknown as User,
    profile: {
      id: '44444444-4444-4444-4444-444444444444',
      role: 'PREGNANT' as UserRole,
      full_name: 'Maria Clara',
      phone: '(11) 99876-5432',
      avatar_url: null,
      must_change_password: false,
      doula_status: 'ONLINE' as DoulaAvailability,
      doula_status_message: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    } as Profile,
  },
};

export type MockUserKey = keyof typeof MOCK_USERS;

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  setProfile: (profile: Profile | null) => void;
  mockLogin: (userKey: MockUserKey) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback to metadata if profiles table row is not yet created or inaccessible
        const currentUser = get().user;
        if (currentUser && currentUser.id === userId) {
          const fallbackProfile: Profile = {
            id: userId,
            role: (currentUser.user_metadata?.role as UserRole) || 'PREGNANT',
            full_name: currentUser.user_metadata?.full_name || 'Usuário',
            phone: currentUser.user_metadata?.phone || null,
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            must_change_password: Boolean(currentUser.user_metadata?.must_change_password),
            doula_status: 'ONLINE',
            doula_status_message: null,
            created_at: currentUser.created_at,
            updated_at: currentUser.created_at,
          };
          return fallbackProfile;
        }
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      // 1. Check for real Supabase Session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!error && session?.user) {
        let profile = await get().fetchProfile(session.user.id);
        if (!profile) {
          profile = {
            id: session.user.id,
            role: (session.user.user_metadata?.role as UserRole) || 'PREGNANT',
            full_name: session.user.user_metadata?.full_name || 'Usuário',
            phone: session.user.user_metadata?.phone || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            must_change_password: Boolean(session.user.user_metadata?.must_change_password),
            doula_status: 'ONLINE',
            doula_status_message: null,
            created_at: session.user.created_at,
            updated_at: session.user.created_at,
          };
        }
        set({
          user: session.user,
          session,
          profile,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        // 2. Check for persisted Mock Session in dev environment
        const savedMockKey = await safeStorage.getItem(MOCK_STORAGE_KEY);
        if (savedMockKey && savedMockKey in MOCK_USERS) {
          const mock = MOCK_USERS[savedMockKey as MockUserKey];
          // Check if password change was persisted for this mock
          const changedPassword = await safeStorage.getItem(`${MOCK_STORAGE_KEY}_pw_changed`);
          const mustChange = savedMockKey === 'pregnantFirstAccess' && !changedPassword;

          set({
            user: mock.user,
            session: null,
            profile: {
              ...mock.profile,
              must_change_password: mustChange,
            },
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } else {
          set({
            user: null,
            session: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      }

      // 3. Listen to Supabase auth state transitions
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession?.user) {
          // If no mock session active, clear state
          const currentMock = await safeStorage.getItem(MOCK_STORAGE_KEY);
          if (!currentMock) {
            set({
              user: null,
              session: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Clear mock key on real sign-in
          await safeStorage.removeItem(MOCK_STORAGE_KEY);
          let profile = await get().fetchProfile(newSession.user.id);
          if (!profile) {
            profile = {
              id: newSession.user.id,
              role: (newSession.user.user_metadata?.role as UserRole) || 'PREGNANT',
              full_name: newSession.user.user_metadata?.full_name || 'Usuário',
              phone: newSession.user.user_metadata?.phone || null,
              avatar_url: newSession.user.user_metadata?.avatar_url || null,
              must_change_password: Boolean(newSession.user.user_metadata?.must_change_password),
              doula_status: 'ONLINE',
              doula_status_message: null,
              created_at: newSession.user.created_at,
              updated_at: newSession.user.created_at,
            };
          }
          set({
            user: newSession.user,
            session: newSession,
            profile,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      });
    } catch {
      set({
        user: null,
        session: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  login: async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    set({ isLoading: true, error: null });

    // 1. Attempt Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        await safeStorage.removeItem(MOCK_STORAGE_KEY);
        let profile = await get().fetchProfile(data.user.id);
        if (!profile) {
          profile = {
            id: data.user.id,
            role: (data.user.user_metadata?.role as UserRole) || 'PREGNANT',
            full_name: data.user.user_metadata?.full_name || 'Usuário',
            phone: data.user.user_metadata?.phone || null,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            must_change_password: Boolean(data.user.user_metadata?.must_change_password),
            doula_status: 'ONLINE',
            doula_status_message: null,
            created_at: data.user.created_at,
            updated_at: data.user.created_at,
          };
        }

        set({
          user: data.user,
          session: data.session,
          profile,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }
    } catch {
      // Backend unreachable or offline, will check mock credentials below
    }

    // 2. Demo / Mock credentials fallback for local dev & testing
    const acceptedPasswords = ['123456', 'Password123!', 'password'];

    if (cleanEmail === MOCK_USERS.doula.user.email && acceptedPasswords.includes(password)) {
      await get().mockLogin('doula');
      return { success: true };
    }

    if (cleanEmail === MOCK_USERS.pregnantFirstAccess.user.email && acceptedPasswords.includes(password)) {
      await get().mockLogin('pregnantFirstAccess');
      return { success: true };
    }

    if (cleanEmail === MOCK_USERS.pregnantActive.user.email && acceptedPasswords.includes(password)) {
      await get().mockLogin('pregnantActive');
      return { success: true };
    }

    const errorMessage = 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
    set({ isLoading: false, error: errorMessage });
    return { success: false, error: errorMessage };
  },

  mockLogin: async (userKey: MockUserKey) => {
    const mock = MOCK_USERS[userKey];
    if (!mock) return;

    await safeStorage.setItem(MOCK_STORAGE_KEY, userKey);
    let mustChange = mock.profile.must_change_password;

    if (userKey === 'pregnantFirstAccess') {
      const changedPassword = await safeStorage.getItem(`${MOCK_STORAGE_KEY}_pw_changed`);
      if (changedPassword) {
        mustChange = false;
      }
    }

    set({
      user: mock.user,
      session: null,
      profile: {
        ...mock.profile,
        must_change_password: mustChange,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  changePassword: async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    const { user, profile } = get();
    if (!user || !profile) {
      return { success: false, error: 'Nenhum usuário autenticado.' };
    }

    set({ isLoading: true, error: null });

    try {
      const isMockUser =
        user.id.startsWith('11111111') ||
        user.id.startsWith('22222222') ||
        user.id.startsWith('44444444');

      if (!isMockUser) {
        // Real Supabase User
        const { error: authError } = await supabase.auth.updateUser({
          password: newPassword,
          data: { must_change_password: false },
        });

        if (authError) {
          set({ isLoading: false, error: authError.message });
          return { success: false, error: authError.message };
        }

        // Update database profile
        const { error: dbError } = await supabase
          .from('profiles')
          .update({
            must_change_password: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (dbError) {
          console.warn('Could not update profiles table directly, user_metadata updated:', dbError);
        }
      } else {
        // Mock user password change persistence
        await safeStorage.setItem(`${MOCK_STORAGE_KEY}_pw_changed`, 'true');
      }

      set({
        profile: {
          ...profile,
          must_change_password: false,
          updated_at: new Date().toISOString(),
        },
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Falha ao alterar senha. Tente novamente.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if supabase client was disconnected
    }
    await safeStorage.removeItem(MOCK_STORAGE_KEY);
    await safeStorage.removeItem(`${MOCK_STORAGE_KEY}_pw_changed`);

    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
}));

