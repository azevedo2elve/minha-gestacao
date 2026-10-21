import { supabase, safeStorage } from '@/lib/supabase';
import {
  getGestationalAge,
  hasObstetricRedFlag,
  formatToIsoDateString,
  normalizeToUtcDate,
  calculateDpp,
  GestationalAgeResult,
} from '@/lib/obstetrics';
import {
  DailyLog,
  Pregnancy,
  Profile,
  Baby,
  FetalMovementLevel,
} from '@/types/database';

export interface SaveDailyLogPayload {
  pregnancyId: string;
  logDate: string; // 'YYYY-MM-DD'
  effectiveDum: string;
  moodTags: string[];
  symptomTags: string[];
  fetalMovement: FetalMovementLevel;
  sleepQuality: number | null;
  hydrationLevel: number | null;
  motherWeightKg?: number | null;
  babyEstimatedWeightG?: number | null;
  bloodPressure?: string | null;
  nutritionNotes?: string | null;
  notes?: string | null;
}

export interface SaveDailyLogResult {
  success: boolean;
  log?: DailyLog;
  hasRedFlag: boolean;
  redFlagReasons: string[];
  error?: string;
}

export interface ClientDossierData {
  pregnancy: Pregnancy;
  pregnantProfile: Profile;
  baby: Baby | null;
  logs: DailyLog[];
  gestationalAge: GestationalAgeResult;
  activeRedFlagsCount: number;
}

const STORAGE_DIARY_PREFIX = '@minha_gestacao:daily_logs:';

/**
 * Returns storage key for a pregnancy's logs
 */
function getStorageKey(pregnancyId: string): string {
  return `${STORAGE_DIARY_PREFIX}${pregnancyId}`;
}

/**
 * Computes clinical reasons for obstetric red flags
 */
export function getRedFlagReasons(params: {
  symptomTags?: string[];
  fetalMovement?: FetalMovementLevel;
  gestationalWeeks?: number;
}): string[] {
  const { symptomTags = [], fetalMovement, gestationalWeeks = 0 } = params;
  const reasons: string[] = [];

  if (symptomTags.includes('SANGRAMENTO')) {
    reasons.push('Sangramento vaginal registrado');
  }
  if (symptomTags.includes('PERDA_LIQUIDO')) {
    reasons.push('Perda involuntária de líquido amniótico');
  }
  if (symptomTags.includes('CEFALEIA_VISAO_TURVA')) {
    reasons.push('Cefaleia com alteração visual (visão turva / escotomas)');
  }
  if (fetalMovement === 'DECREASED' && gestationalWeeks >= 28) {
    reasons.push(`Movimentação fetal diminuída na ${gestationalWeeks}ª semana`);
  }

  return reasons;
}

/**
 * Reads local storage logs for a pregnancy
 */
async function getStoredLogs(pregnancyId: string): Promise<DailyLog[]> {
  try {
    const raw = await safeStorage.getItem(getStorageKey(pregnancyId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves local storage logs for a pregnancy
 */
async function saveStoredLogs(pregnancyId: string, logs: DailyLog[]): Promise<void> {
  try {
    await safeStorage.setItem(getStorageKey(pregnancyId), JSON.stringify(logs));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetches a single daily log for a pregnancy on a given date (YYYY-MM-DD)
 */
export async function fetchDailyLogByDate(
  pregnancyId: string,
  logDate: string
): Promise<DailyLog | null> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .eq('log_date', logDate)
      .single();

    if (!error && data) {
      return data as DailyLog;
    }
  } catch {
    // Continue to local storage
  }

  // 2. Fallback to local storage
  const storedLogs = await getStoredLogs(pregnancyId);
  const found = storedLogs.find((l) => l.log_date === logDate);
  if (found) return found;

  // 3. Fallback mock for demonstration if mock client
  const mockDefaults = getMockDefaultLogs(pregnancyId);
  return mockDefaults.find((l) => l.log_date === logDate) || null;
}

/**
 * Fetches all daily logs for a pregnancy, sorted newest first
 */
export async function fetchPregnancyDailyLogs(pregnancyId: string): Promise<DailyLog[]> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('pregnancy_id', pregnancyId)
      .order('log_date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as DailyLog[];
    }
  } catch {
    // Continue to local storage
  }

  // 2. Check local storage
  const storedLogs = await getStoredLogs(pregnancyId);
  if (storedLogs.length > 0) {
    return storedLogs.sort((a, b) => b.log_date.localeCompare(a.log_date));
  }

  // 3. Return mock defaults if available
  return getMockDefaultLogs(pregnancyId).sort((a, b) => b.log_date.localeCompare(a.log_date));
}

/**
 * RN03 & RN04: Saves or updates (UPSERT) a daily log
 */
export async function saveDailyLog(payload: SaveDailyLogPayload): Promise<SaveDailyLogResult> {
  const {
    pregnancyId,
    logDate,
    effectiveDum,
    moodTags,
    symptomTags,
    fetalMovement,
    sleepQuality,
    hydrationLevel,
    motherWeightKg,
    babyEstimatedWeightG,
    bloodPressure,
    nutritionNotes,
    notes,
  } = payload;

  // 1. Calculate gestational age at log date
  const ga = getGestationalAge(effectiveDum, logDate);

  // 2. Check for Obstetric Red Flags (RN04)
  const isRedFlag = hasObstetricRedFlag({
    symptomTags,
    fetalMovement,
    gestationalWeeks: ga.weeks,
  });

  const redFlagReasons = getRedFlagReasons({
    symptomTags,
    fetalMovement,
    gestationalWeeks: ga.weeks,
  });

  const nowIso = new Date().toISOString();

  const logPayload: Partial<DailyLog> = {
    pregnancy_id: pregnancyId,
    log_date: logDate,
    gestational_week_at_log: ga.weeks,
    gestational_days_at_log: ga.days,
    mood_tags: moodTags,
    symptom_tags: symptomTags,
    fetal_movement: fetalMovement,
    sleep_quality: sleepQuality,
    hydration_level: hydrationLevel,
    mother_weight_kg: motherWeightKg !== undefined && motherWeightKg !== null ? Number(motherWeightKg) : null,
    baby_estimated_weight_g:
      babyEstimatedWeightG !== undefined && babyEstimatedWeightG !== null
        ? Number(babyEstimatedWeightG)
        : null,
    blood_pressure: bloodPressure?.trim() || null,
    nutrition_notes: nutritionNotes?.trim() || null,
    notes: notes?.trim() || null,
    has_red_flag: isRedFlag,
    updated_at: nowIso,
  };

  let savedLog: DailyLog | null = null;

  // 3. Attempt Supabase UPSERT
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(
        {
          ...logPayload,
          created_at: nowIso,
        },
        { onConflict: 'pregnancy_id,log_date' }
      )
      .select()
      .single();

    if (!error && data) {
      savedLog = data as DailyLog;
    }
  } catch {
    // Fallback to local storage
  }

  // 4. Update local storage (Offline fallback & persistent dev state)
  const existingLogs = await getStoredLogs(pregnancyId);
  const existingIndex = existingLogs.findIndex((l) => l.log_date === logDate);

  const localRecord: DailyLog = {
    id: savedLog?.id || (existingIndex >= 0 ? existingLogs[existingIndex].id : `log-${pregnancyId}-${logDate}`),
    pregnancy_id: pregnancyId,
    log_date: logDate,
    gestational_week_at_log: ga.weeks,
    gestational_days_at_log: ga.days,
    mood_tags: moodTags,
    symptom_tags: symptomTags,
    fetal_movement: fetalMovement,
    sleep_quality: sleepQuality,
    hydration_level: hydrationLevel,
    nutrition_notes: logPayload.nutrition_notes || null,
    mother_weight_kg: logPayload.mother_weight_kg ?? null,
    baby_estimated_weight_g: logPayload.baby_estimated_weight_g ?? null,
    baby_percentile: null,
    blood_pressure: logPayload.blood_pressure || null,
    notes: logPayload.notes || null,
    belly_photo_url: null,
    has_red_flag: isRedFlag,
    seen_by_doula_at: null,
    created_at: existingIndex >= 0 ? existingLogs[existingIndex].created_at : nowIso,
    updated_at: nowIso,
  };

  if (existingIndex >= 0) {
    existingLogs[existingIndex] = localRecord;
  } else {
    existingLogs.push(localRecord);
  }

  await saveStoredLogs(pregnancyId, existingLogs);

  return {
    success: true,
    log: savedLog || localRecord,
    hasRedFlag: isRedFlag,
    redFlagReasons,
  };
}

/**
 * Marks a daily log as seen/reviewed by the Doula
 */
export async function markLogSeenByDoula(pregnancyId: string, logId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();

  // 1. Try Supabase
  try {
    await supabase
      .from('daily_logs')
      .update({ seen_by_doula_at: nowIso })
      .eq('id', logId);
  } catch {
    // Continue
  }

  // 2. Update local storage
  const logs = await getStoredLogs(pregnancyId);
  const updated = logs.map((l) => (l.id === logId ? { ...l, seen_by_doula_at: nowIso } : l));
  await saveStoredLogs(pregnancyId, updated);

  return true;
}

/**
 * Fetches 360º Dossier for a client (doula view: /(doula)/client/[id])
 */
export async function fetchClientDossier(pregnancyId: string): Promise<ClientDossierData> {
  // 1. Try Supabase
  try {
    const { data: pregnancy, error: pError } = await supabase
      .from('pregnancies')
      .select(`
        *,
        profiles:pregnant_user_id (*),
        babies (*)
      `)
      .eq('id', pregnancyId)
      .single();

    if (!pError && pregnancy) {
      const ga = getGestationalAge(pregnancy.effective_dum);
      const logs = await fetchPregnancyDailyLogs(pregnancyId);
      const baby = Array.isArray(pregnancy.babies) && pregnancy.babies.length > 0 ? pregnancy.babies[0] : null;

      const activeRedFlagsCount = logs.filter((l) => l.has_red_flag && !l.seen_by_doula_at).length;

      return {
        pregnancy: pregnancy as Pregnancy,
        pregnantProfile: pregnancy.profiles as Profile,
        baby,
        logs,
        gestationalAge: ga,
        activeRedFlagsCount,
      };
    }
  } catch {
    // Continue to mock fallback
  }

  // 2. Mock fallback matching dashboard data
  return getMockClientDossier(pregnancyId);
}

/**
 * Helper to generate mock initial logs for known mock clients
 */
function getMockDefaultLogs(pregnancyId: string): DailyLog[] {
  const today = formatToIsoDateString(new Date());
  const yesterday = formatToIsoDateString(normalizeToUtcDate(new Date(Date.now() - 86400000)));
  const twoDaysAgo = formatToIsoDateString(normalizeToUtcDate(new Date(Date.now() - 2 * 86400000)));

  if (pregnancyId === 'p-camila-01') {
    return [
      {
        id: 'rf-camila-01',
        pregnancy_id: 'p-camila-01',
        log_date: today,
        gestational_week_at_log: 28,
        gestational_days_at_log: 4,
        mood_tags: ['ANSIOSA', 'CANSADA'],
        symptom_tags: ['CEFALEIA_VISAO_TURVA', 'INCHACO'],
        fetal_movement: 'NORMAL',
        sleep_quality: 2,
        hydration_level: 3,
        mother_weight_kg: 68.2,
        baby_estimated_weight_g: 1150,
        baby_percentile: 50,
        blood_pressure: '135/85',
        notes: 'Senti dor de cabeça persistente após o almoço e algumas luzinhas brilhantes no campo de visão.',
        nutrition_notes: 'Boa hidratação à tarde',
        belly_photo_url: null,
        has_red_flag: true,
        seen_by_doula_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'log-camila-yesterday',
        pregnancy_id: 'p-camila-01',
        log_date: yesterday,
        gestational_week_at_log: 28,
        gestational_days_at_log: 3,
        mood_tags: ['TRANQUILA', 'GRATA'],
        symptom_tags: ['DOR_LOMBAR'],
        fetal_movement: 'VERY_ACTIVE',
        sleep_quality: 4,
        hydration_level: 4,
        mother_weight_kg: null,
        baby_estimated_weight_g: null,
        baby_percentile: null,
        blood_pressure: '120/80',
        notes: 'Dia tranquilo. A Maya mexeu bastante depois da aula de pilates.',
        nutrition_notes: null,
        belly_photo_url: null,
        has_red_flag: false,
        seen_by_doula_at: yesterday,
        created_at: yesterday,
        updated_at: yesterday,
      },
    ];
  }

  if (pregnancyId === 'p-juliana-02') {
    return [
      {
        id: 'log-juliana-01',
        pregnancy_id: 'p-juliana-02',
        log_date: today,
        gestational_week_at_log: 21,
        gestational_days_at_log: 3,
        mood_tags: ['FELIZ', 'CONECTADA'],
        symptom_tags: ['SEM_SINTOMAS'],
        fetal_movement: 'NORMAL',
        sleep_quality: 4,
        hydration_level: 5,
        mother_weight_kg: 63.5,
        baby_estimated_weight_g: 420,
        baby_percentile: null,
        blood_pressure: '110/70',
        notes: 'Sentindo os primeiros movimentos do Theo com bastante clareza!',
        nutrition_notes: 'Frutas e bastante água ao longo do dia.',
        belly_photo_url: null,
        has_red_flag: false,
        seen_by_doula_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  if (pregnancyId === 'mock-pregnancy-active') {
    return [
      {
        id: 'log-active-yesterday',
        pregnancy_id: 'mock-pregnancy-active',
        log_date: yesterday,
        gestational_week_at_log: 24,
        gestational_days_at_log: 2,
        mood_tags: ['TRANQUILA', 'FELIZ'],
        symptom_tags: ['AZIA'],
        fetal_movement: 'NORMAL',
        sleep_quality: 3,
        hydration_level: 4,
        mother_weight_kg: 64.0,
        baby_estimated_weight_g: 650,
        baby_percentile: null,
        blood_pressure: '120/80',
        notes: 'Exercícios na bola suíça ajudaram muito com a sensação de leveza na pelve.',
        nutrition_notes: 'Evitei café para amenizar a azia.',
        belly_photo_url: null,
        has_red_flag: false,
        seen_by_doula_at: yesterday,
        created_at: yesterday,
        updated_at: yesterday,
      },
    ];
  }

  return [];
}

/**
 * Builds mock client dossier for client view
 */
function getMockClientDossier(pregnancyId: string): ClientDossierData {
  const isCamila = pregnancyId === 'p-camila-01';
  const isJuliana = pregnancyId === 'p-juliana-02';
  const isMariana = pregnancyId === 'p-mariana-04';

  const name = isCamila
    ? 'Camila Santos'
    : isJuliana
    ? 'Juliana Ferreira'
    : isMariana
    ? 'Mariana Costa'
    : 'Maria Clara';

  const babyNick = isCamila
    ? 'Maya'
    : isJuliana
    ? 'Theo'
    : isMariana
    ? 'Lucas'
    : 'Bebê';

  const babyGender = isCamila ? 'FEMALE' : 'MALE';
  const daysAgo = isCamila ? 200 : isJuliana ? 150 : isMariana ? 255 : 171;

  const dum = formatToIsoDateString(normalizeToUtcDate(new Date(Date.now() - daysAgo * 86400000)));
  const dpp = formatToIsoDateString(calculateDpp(dum));
  const ga = getGestationalAge(dum);
  const logs = getMockDefaultLogs(pregnancyId);

  const mockProfile: Profile = {
    id: `user-${pregnancyId}`,
    role: 'PREGNANT',
    full_name: name,
    phone: '(11) 91234-5678',
    avatar_url: null,
    must_change_password: false,
    doula_status: 'ONLINE',
    doula_status_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockPregnancy: Pregnancy = {
    id: pregnancyId,
    pregnant_user_id: mockProfile.id,
    doula_user_id: '11111111-1111-1111-1111-111111111111',
    status: 'ACTIVE',
    calc_method: 'DUM',
    dum_date: dum,
    ultrasound_date: null,
    ultrasound_weeks: null,
    ultrasound_days: null,
    effective_dum: dum,
    dpp_date: dpp,
    height_cm: 165,
    pre_pregnancy_weight_kg: 62.0,
    blood_type: 'A+',
    gravida_count: 2,
    vaginal_births_count: 1,
    cesarean_count: 0,
    abortions_count: 0,
    partner_name: 'Felipe Santos',
    partner_phone: '(11) 98777-6655',
    support_network_notes: 'Parceiro muito participativo e mãe disponível.',
    health_conditions: null,
    medications_in_use: 'Suplementação vitamínica perinatal.',
    desired_birth_type: 'Parto Humanizado / Normal',
    target_maternity_hospital: 'Hospital Pro Matre Paulista',
    obstetrician_name: 'Dra. Gabriela Vasconcelos',
    doula_private_notes: 'Gestante tranquila com boa resposta a exercícios respiratórios.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockBaby: Baby = {
    id: `baby-${pregnancyId}`,
    pregnancy_id: pregnancyId,
    nickname: babyNick,
    official_name: null,
    gender: babyGender,
    birth_datetime: null,
    birth_weight_g: null,
    birth_length_cm: null,
    apgar_1min: null,
    apgar_5min: null,
    birth_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const activeRedFlagsCount = logs.filter((l) => l.has_red_flag && !l.seen_by_doula_at).length;

  return {
    pregnancy: mockPregnancy,
    pregnantProfile: mockProfile,
    baby: mockBaby,
    logs,
    gestationalAge: ga,
    activeRedFlagsCount,
  };
}
