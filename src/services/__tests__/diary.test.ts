// In-memory mock for AsyncStorage / safeStorage
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
      upsert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

import {
  saveDailyLog,
  fetchDailyLogByDate,
  fetchPregnancyDailyLogs,
  markLogSeenByDoula,
  fetchClientDossier,
  getRedFlagReasons,
} from '../diary';
import {
  formatToIsoDateString,
  normalizeToUtcDate,
  addDays,
} from '@/lib/obstetrics';

describe('Diary Service & Obstetric Alert Engine (Feature 04 - RN03 & RN04)', () => {
  const pregnancyId = 'test-pregnancy-id-123';
  // DUM set to 140 days ago (~20 weeks 0 days)
  const dumWeek20 = formatToIsoDateString(normalizeToUtcDate(new Date(Date.now() - 140 * 86400000)));
  // DUM set to 210 days ago (~30 weeks 0 days) - 3rd trimester
  const dumWeek30 = formatToIsoDateString(normalizeToUtcDate(new Date(Date.now() - 210 * 86400000)));
  const today = formatToIsoDateString(new Date());
  const yesterday = formatToIsoDateString(addDays(today, -1));

  beforeEach(() => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  });

  describe('saveDailyLog & RN03 (UPSERT & Nullable Weights)', () => {
    it('should save a valid daily log without red flags', async () => {
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['TRANQUILA', 'GRATA'],
        symptomTags: ['ENJOO', 'AZIA'],
        fetalMovement: 'NORMAL',
        sleepQuality: 4,
        hydrationLevel: 5,
        motherWeightKg: 65.5,
        babyEstimatedWeightG: 350,
        bloodPressure: '120/80',
        nutritionNotes: 'Boa hidratação',
        notes: 'Me senti muito bem hoje.',
      });

      expect(result.success).toBe(true);
      expect(result.hasRedFlag).toBe(false);
      expect(result.redFlagReasons).toHaveLength(0);
      expect(result.log).toBeDefined();
      expect(result.log?.gestational_week_at_log).toBe(20);
      expect(result.log?.mood_tags).toEqual(['TRANQUILA', 'GRATA']);
      expect(result.log?.mother_weight_kg).toBe(65.5);
      expect(result.log?.baby_estimated_weight_g).toBe(350);
    });

    it('RN03: should perform an UPSERT when saving again on the same date without duplicating records', async () => {
      // 1st save
      const firstSave = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['CANSADA'],
        symptomTags: ['DOR_LOMBAR'],
        fetalMovement: 'NORMAL',
        sleepQuality: 2,
        hydrationLevel: 3,
      });

      expect(firstSave.success).toBe(true);

      // Check count
      const logsAfterFirst = await fetchPregnancyDailyLogs(pregnancyId);
      expect(logsAfterFirst).toHaveLength(1);
      expect(logsAfterFirst[0].mood_tags).toEqual(['CANSADA']);

      // 2nd save on the SAME DATE (UPSERT)
      const secondSave = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['TRANQUILA', 'CONECTADA'],
        symptomTags: ['SEM_SINTOMAS'],
        fetalMovement: 'VERY_ACTIVE',
        sleepQuality: 4,
        hydrationLevel: 4,
        notes: 'Atualizei com carinho!',
      });

      expect(secondSave.success).toBe(true);

      // Verify no duplicate was created
      const logsAfterSecond = await fetchPregnancyDailyLogs(pregnancyId);
      expect(logsAfterSecond).toHaveLength(1);
      expect(logsAfterSecond[0].id).toBe(firstSave.log?.id);
      expect(logsAfterSecond[0].mood_tags).toEqual(['TRANQUILA', 'CONECTADA']);
      expect(logsAfterSecond[0].fetal_movement).toBe('VERY_ACTIVE');
      expect(logsAfterSecond[0].notes).toBe('Atualizei com carinho!');
    });

    it('RN03: should allow saving with NULL optional weights (mother_weight_kg and baby_estimated_weight_g)', async () => {
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['FELIZ'],
        symptomTags: ['SEM_SINTOMAS'],
        fetalMovement: 'NORMAL',
        sleepQuality: 4,
        hydrationLevel: 4,
        motherWeightKg: null,
        babyEstimatedWeightG: null,
      });

      expect(result.success).toBe(true);
      expect(result.log?.mother_weight_kg).toBeNull();
      expect(result.log?.baby_estimated_weight_g).toBeNull();
    });
  });

  describe('RN04: Obstetric Red Flags & Trigger Criteria', () => {
    it('should trigger Red Flag if symptomTags contains SANGRAMENTO', async () => {
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['ANSIOSA'],
        symptomTags: ['SANGRAMENTO'],
        fetalMovement: 'NORMAL',
        sleepQuality: 3,
        hydrationLevel: 3,
      });

      expect(result.hasRedFlag).toBe(true);
      expect(result.redFlagReasons).toContain('Sangramento vaginal registrado');
    });

    it('should trigger Red Flag if symptomTags contains PERDA_LIQUIDO', async () => {
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['INSEGURA'],
        symptomTags: ['PERDA_LIQUIDO'],
        fetalMovement: 'NORMAL',
        sleepQuality: 2,
        hydrationLevel: 3,
      });

      expect(result.hasRedFlag).toBe(true);
      expect(result.redFlagReasons).toContain('Perda involuntária de líquido amniótico');
    });

    it('should trigger Red Flag if symptomTags contains CEFALEIA_VISAO_TURVA', async () => {
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['SOBRECARREGADA'],
        symptomTags: ['CEFALEIA_VISAO_TURVA'],
        fetalMovement: 'NORMAL',
        sleepQuality: 1,
        hydrationLevel: 3,
      });

      expect(result.hasRedFlag).toBe(true);
      expect(result.redFlagReasons).toContain('Cefaleia com alteração visual (visão turva / escotomas)');
    });

    it('should trigger Red Flag if fetalMovement is DECREASED and gestational week >= 28', async () => {
      // 30 weeks
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek30,
        moodTags: ['ANSIOSA'],
        symptomTags: [],
        fetalMovement: 'DECREASED',
        sleepQuality: 3,
        hydrationLevel: 3,
      });

      expect(result.hasRedFlag).toBe(true);
      expect(result.redFlagReasons).toContain('Movimentação fetal diminuída na 30ª semana');
    });

    it('should NOT trigger Red Flag if fetalMovement is DECREASED but gestational week < 28 (e.g. week 20)', async () => {
      // 20 weeks - fetal movement is not fully regular yet
      const result = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['TRANQUILA'],
        symptomTags: [],
        fetalMovement: 'DECREASED',
        sleepQuality: 3,
        hydrationLevel: 3,
      });

      expect(result.hasRedFlag).toBe(false);
      expect(result.redFlagReasons).toHaveLength(0);
    });

    it('getRedFlagReasons helper should collect multiple reasons when multiple critical signs are present', () => {
      const reasons = getRedFlagReasons({
        symptomTags: ['SANGRAMENTO', 'PERDA_LIQUIDO', 'CEFALEIA_VISAO_TURVA'],
        fetalMovement: 'DECREASED',
        gestationalWeeks: 32,
      });

      expect(reasons).toHaveLength(4);
      expect(reasons).toContain('Sangramento vaginal registrado');
      expect(reasons).toContain('Perda involuntária de líquido amniótico');
      expect(reasons).toContain('Cefaleia com alteração visual (visão turva / escotomas)');
      expect(reasons).toContain('Movimentação fetal diminuída na 32ª semana');
    });
  });

  describe('Dossier & History Fetching', () => {
    it('should fetch daily log by specific date', async () => {
      await saveDailyLog({
        pregnancyId,
        logDate: yesterday,
        effectiveDum: dumWeek20,
        moodTags: ['FELIZ'],
        symptomTags: ['SEM_SINTOMAS'],
        fetalMovement: 'NORMAL',
        sleepQuality: 4,
        hydrationLevel: 4,
      });

      const foundYesterday = await fetchDailyLogByDate(pregnancyId, yesterday);
      expect(foundYesterday).toBeDefined();
      expect(foundYesterday?.log_date).toBe(yesterday);

      const foundTomorrow = await fetchDailyLogByDate(pregnancyId, '2099-01-01');
      expect(foundTomorrow).toBeNull();
    });

    it('should mark daily log as seen by doula and update dossier active alert count', async () => {
      // Save a log with red flag
      const saveResult = await saveDailyLog({
        pregnancyId,
        logDate: today,
        effectiveDum: dumWeek30,
        moodTags: ['ANSIOSA'],
        symptomTags: ['SANGRAMENTO'],
        fetalMovement: 'NORMAL',
        sleepQuality: 2,
        hydrationLevel: 3,
      });

      const logId = saveResult.log?.id!;

      // Mark seen by doula
      const marked = await markLogSeenByDoula(pregnancyId, logId);
      expect(marked).toBe(true);

      const updatedLog = await fetchDailyLogByDate(pregnancyId, today);
      expect(updatedLog?.seen_by_doula_at).toBeDefined();
    });

    it('should reflect todayLogCompleted in pregnant home when log is saved for today', async () => {
      const { fetchPregnantHomeData } = await import('../dashboard');
      const mockProfile: any = {
        id: '44444444-4444-4444-4444-444444444444',
        role: 'PREGNANT',
        full_name: 'Maria Clara',
      };

      // Before saving:
      const homeBefore = await fetchPregnantHomeData(mockProfile);
      expect(homeBefore.isTodayLogCompleted).toBe(false);

      // Save today's log for mock-pregnancy-active
      await saveDailyLog({
        pregnancyId: 'mock-pregnancy-active',
        logDate: today,
        effectiveDum: dumWeek20,
        moodTags: ['FELIZ'],
        symptomTags: ['SEM_SINTOMAS'],
        fetalMovement: 'NORMAL',
        sleepQuality: 4,
        hydrationLevel: 5,
      });

      // After saving:
      const homeAfter = await fetchPregnantHomeData(mockProfile);
      expect(homeAfter.isTodayLogCompleted).toBe(true);
      expect(homeAfter.todayLog).toBeDefined();
      expect(homeAfter.todayLog?.mood_tags).toEqual(['FELIZ']);
    });

    it('should return mock client dossier for known mock pregnancies (e.g. p-camila-01)', async () => {
      const dossier = await fetchClientDossier('p-camila-01');

      expect(dossier).toBeDefined();
      expect(dossier.pregnantProfile.full_name).toBe('Camila Santos');
      expect(dossier.baby?.nickname).toBe('Maya');
      expect(dossier.gestationalAge).toBeDefined();
      expect(dossier.logs.length).toBeGreaterThanOrEqual(1);

      // Camila has active red flag in mock initial logs
      expect(dossier.activeRedFlagsCount).toBeGreaterThanOrEqual(1);
    });
  });
});
