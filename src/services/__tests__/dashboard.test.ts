// In-memory mock for AsyncStorage
const storageMock: Record<string, string> = {};

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
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(async () => ({ data: null, error: null })),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

import {
  fetchDoulaDashboardData,
  updateDoulaAvailability,
  acknowledgeRedFlag,
  fetchPregnantHomeData,
  toggleTaskCompletion,
} from '../dashboard';
import {
  getGestationalMetadata,
  getBabySizeIllustration,
  GESTATIONAL_WEEKS_METADATA,
} from '@/lib/gestational-metadata';
import { getGestationalAge } from '@/lib/obstetrics';
import { Profile } from '@/types/database';

describe('Gestational Metadata Engine (RN01 & Feature 03)', () => {
  it('should return valid metadata for week 4 (Semente de Papoula)', () => {
    const meta = getGestationalMetadata(4);
    expect(meta.week_number).toBe(4);
    expect(meta.trimester).toBe(1);
    expect(meta.baby_size_comparison).toBe('Semente de Papoula');
    expect(meta.illustration_key).toBe('poppy_seed');
    expect(meta.avg_length_cm).toBe(0.4);
    expect(meta.avg_weight_g).toBe(1);
    expect(meta.doula_tip_of_week).toBeDefined();
  });

  it('should return valid metadata for week 24 (Espiga de Milho - 2º Trimestre)', () => {
    const meta = getGestationalMetadata(24);
    expect(meta.week_number).toBe(24);
    expect(meta.trimester).toBe(2);
    expect(meta.baby_size_comparison).toBe('Espiga de Milho');
    expect(meta.illustration_key).toBe('corn');
    expect(meta.avg_length_cm).toBe(30.0);
    expect(meta.avg_weight_g).toBe(630);
    expect(meta.baby_development_summary).toContain('surfactante');
  });

  it('should return valid metadata for week 40 (DPP - 3º Trimestre)', () => {
    const meta = getGestationalMetadata(40);
    expect(meta.week_number).toBe(40);
    expect(meta.trimester).toBe(3);
    expect(meta.baby_size_comparison).toBe('Abóbora Moranga');
    expect(meta.illustration_key).toBe('pumpkin');
  });

  it('should clamp out of range weeks properly (e.g. week 0 clamped to 1, week 50 clamped to 42)', () => {
    const minMeta = getGestationalMetadata(0);
    expect(minMeta.week_number).toBe(1);

    const maxMeta = getGestationalMetadata(50);
    expect(maxMeta.week_number).toBe(42);
  });

  it('should map illustration keys to correct emojis', () => {
    expect(getBabySizeIllustration('poppy_seed')).toBe('🌱');
    expect(getBabySizeIllustration('corn')).toBe('🌽');
    expect(getBabySizeIllustration('pumpkin')).toBe('🎃');
    expect(getBabySizeIllustration('unknown_fruit')).toBe('👶');
  });
});

describe('Doula Dashboard Service (RN04 & Feature 03)', () => {
  beforeEach(() => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  });

  it('should fetch doula dashboard data with active clients and calculated gestational age', async () => {
    const data = await fetchDoulaDashboardData('11111111-1111-1111-1111-111111111111');

    expect(data).toBeDefined();
    expect(data.doula).toBeDefined();
    expect(data.clients.length).toBeGreaterThanOrEqual(3);

    // Verify Camila Santos has calculated IG, baby nickname and red flag
    const camila = data.clients.find((c) => c.pregnantName.includes('Camila'));
    expect(camila).toBeDefined();
    expect(camila?.babyNickname).toBe('Maya');
    expect(camila?.gestationalAge).toBeDefined();
    expect(camila?.gestationalAge.weeks).toBeGreaterThanOrEqual(27);
    expect(camila?.hasRedFlag).toBe(true);

    // Verify stats
    expect(data.stats.totalActive).toBe(data.clients.length);
    expect(data.stats.redFlagsCount).toBeGreaterThanOrEqual(1);
    expect(data.activeRedFlags.length).toBeGreaterThanOrEqual(1);
  });

  it('should update doula availability status', async () => {
    const result = await updateDoulaAvailability(
      '11111111-1111-1111-1111-111111111111',
      'IN_LABOR_SUPPORT',
      'Apoiando parto no Hospital São Luiz'
    );
    expect(result).toBe(true);

    const dashboard = await fetchDoulaDashboardData('11111111-1111-1111-1111-111111111111');
    expect(dashboard.doula.doula_status).toBe('IN_LABOR_SUPPORT');

    // Reset back to ONLINE
    await updateDoulaAvailability('11111111-1111-1111-1111-111111111111', 'ONLINE');
    const resetDashboard = await fetchDoulaDashboardData('11111111-1111-1111-1111-111111111111');
    expect(resetDashboard.doula.doula_status).toBe('ONLINE');
  });

  it('should acknowledge and dismiss red flags from active priority list', async () => {
    const initialData = await fetchDoulaDashboardData('11111111-1111-1111-1111-111111111111');
    const alert = initialData.activeRedFlags[0];
    expect(alert).toBeDefined();

    const ackResult = await acknowledgeRedFlag(alert.logId);
    expect(ackResult).toBe(true);

    const updatedData = await fetchDoulaDashboardData('11111111-1111-1111-1111-111111111111');
    const found = updatedData.activeRedFlags.find((a) => a.logId === alert.logId);
    expect(found).toBeUndefined();
  });
});

describe('Pregnant Home Service (Feature 03)', () => {
  const mockPregnantProfile: Profile = {
    id: '44444444-4444-4444-4444-444444444444',
    role: 'PREGNANT',
    full_name: 'Maria Clara',
    phone: '(11) 99876-5432',
    avatar_url: null,
    must_change_password: false,
    doula_status: 'ONLINE',
    doula_status_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('should fetch complete home data for pregnant user with real obstetric calculation', async () => {
    const homeData = await fetchPregnantHomeData(mockPregnantProfile);

    expect(homeData).toBeDefined();
    expect(homeData.pregnancy).toBeDefined();
    expect(homeData.baby).toBeDefined();
    expect(homeData.baby?.nickname).toBe('Theo');

    // Obstetric calculation
    expect(homeData.gestationalAge).toBeDefined();
    expect(homeData.gestationalAge?.weeks).toBeGreaterThanOrEqual(1);
    expect(homeData.gestationalAge?.daysRemaining).toBeGreaterThan(0);

    // Week metadata matching gestational age
    expect(homeData.weekMetadata).toBeDefined();
    expect(homeData.weekMetadata?.week_number).toBe(homeData.gestationalAge?.weeks);

    // Doula information
    expect(homeData.doula).toBeDefined();
    expect(homeData.doula?.full_name).toContain('Helena');

    // Daily tasks checklist
    expect(homeData.todayTasks.length).toBeGreaterThan(0);
    expect(homeData.todayTasks.some((t) => t.title.includes('bola'))).toBe(true);

    // Events / Video calls
    expect(homeData.upcomingEvents.length).toBeGreaterThan(0);
  });

  it('should toggle task item completion status', async () => {
    const homeData = await fetchPregnantHomeData(mockPregnantProfile);
    const firstTask = homeData.todayTasks[0];
    const initialStatus = firstTask.is_completed;

    const toggleResult = await toggleTaskCompletion(firstTask.id, !initialStatus);
    expect(toggleResult).toBe(true);

    const refreshedData = await fetchPregnantHomeData(mockPregnantProfile);
    const updatedTask = refreshedData.todayTasks.find((t) => t.id === firstTask.id);
    expect(updatedTask?.is_completed).toBe(!initialStatus);

    // Reset back
    await toggleTaskCompletion(firstTask.id, initialStatus);
  });
});

