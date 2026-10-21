import { supabase, safeStorage } from '@/lib/supabase';
import {
  getGestationalAge,
  GestationalAgeResult,
  formatToIsoDateString,
  normalizeToUtcDate,
  calculateDpp,
} from '@/lib/obstetrics';
import { getGestationalMetadata } from '@/lib/gestational-metadata';
import {
  Profile,
  Pregnancy,
  Baby,
  DailyLog,
  CalendarItem,
  GestationalWeekMetadata,
  DoulaAvailability,
  BabyGender,
  PregnancyStatus,
  FetalMovementLevel,
} from '@/types/database';

export interface RedFlagAlertItem {
  logId: string;
  pregnancyId: string;
  pregnantUserId: string;
  pregnantName: string;
  babyNickname: string;
  logDate: string;
  gestationalWeek: number;
  gestationalDays: number;
  symptoms: string[];
  fetalMovement: FetalMovementLevel;
  reason: string;
  createdAt: string;
}

export interface DoulaClientCardData {
  pregnancyId: string;
  pregnantUserId: string;
  pregnantName: string;
  pregnantPhone: string | null;
  babyNickname: string;
  babyGender: BabyGender;
  effectiveDum: string;
  dppDate: string;
  gestationalAge: GestationalAgeResult;
  status: PregnancyStatus;
  hasRedFlag: boolean;
  recentRedFlags: Array<{ id: string; logDate: string; reason: string }>;
  lastLogDate?: string | null;
}

export interface DoulaDashboardData {
  doula: Profile;
  clients: DoulaClientCardData[];
  activeRedFlags: RedFlagAlertItem[];
  stats: {
    totalActive: number;
    firstTrimester: number;
    secondTrimester: number;
    thirdTrimester: number;
    redFlagsCount: number;
  };
}

export interface PregnantHomeData {
  profile: Profile;
  pregnancy: Pregnancy | null;
  baby: Baby | null;
  doula: Profile | null;
  gestationalAge: GestationalAgeResult | null;
  weekMetadata: GestationalWeekMetadata | null;
  todayLog: DailyLog | null;
  isTodayLogCompleted: boolean;
  todayTasks: CalendarItem[];
  upcomingEvents: CalendarItem[];
}

const STORAGE_ACKNOWLEDGED_FLAGS_KEY = '@minha_gestacao:acknowledged_flags';
const STORAGE_COMPLETED_TASKS_KEY = '@minha_gestacao:completed_tasks';
const STORAGE_DOULA_STATUS_KEY = '@minha_gestacao:doula_status';

/**
 * Helper to calculate a past date string relative to current UTC date.
 */
function getPastDateIsoString(daysAgo: number): string {
  const now = normalizeToUtcDate(new Date());
  now.setUTCDate(now.getUTCDate() - daysAgo);
  return formatToIsoDateString(now);
}

/**
 * Builds mock clients dynamically relative to current date so IG is always realistic.
 */
function getMockDoulaClients(): { clients: DoulaClientCardData[]; redFlags: RedFlagAlertItem[] } {
  // Camila: ~28w 4d (200 days ago) - 3rd trimester - Has active red flag
  const dumCamila = getPastDateIsoString(200);
  const gaCamila = getGestationalAge(dumCamila);
  const dppCamila = formatToIsoDateString(calculateDpp(dumCamila));

  // Juliana: ~21w 3d (150 days ago) - 2nd trimester
  const dumJuliana = getPastDateIsoString(150);
  const gaJuliana = getGestationalAge(dumJuliana);
  const dppJuliana = formatToIsoDateString(calculateDpp(dumJuliana));

  // Beatriz: ~10w 0d (70 days ago) - 1st trimester
  const dumBeatriz = getPastDateIsoString(70);
  const gaBeatriz = getGestationalAge(dumBeatriz);
  const dppBeatriz = formatToIsoDateString(calculateDpp(dumBeatriz));

  // Mariana: ~36w 3d (255 days ago) - 3rd trimester (a termo se aproximando)
  const dumMariana = getPastDateIsoString(255);
  const gaMariana = getGestationalAge(dumMariana);
  const dppMariana = formatToIsoDateString(calculateDpp(dumMariana));

  const clients: DoulaClientCardData[] = [
    {
      pregnancyId: 'p-camila-01',
      pregnantUserId: '22222222-2222-2222-2222-222222222222',
      pregnantName: 'Camila Santos',
      pregnantPhone: '(11) 91234-5678',
      babyNickname: 'Maya',
      babyGender: 'FEMALE',
      effectiveDum: dumCamila,
      dppDate: dppCamila,
      gestationalAge: gaCamila,
      status: 'ACTIVE',
      hasRedFlag: true,
      recentRedFlags: [
        {
          id: 'rf-camila-01',
          logDate: formatToIsoDateString(new Date()),
          reason: 'Cefaleia com alteração visual (visão turva) registrada hoje',
        },
      ],
      lastLogDate: formatToIsoDateString(new Date()),
    },
    {
      pregnancyId: 'p-juliana-02',
      pregnantUserId: '33333333-3333-3333-3333-333333333333',
      pregnantName: 'Juliana Ferreira',
      pregnantPhone: '(11) 98111-2233',
      babyNickname: 'Theo',
      babyGender: 'MALE',
      effectiveDum: dumJuliana,
      dppDate: dppJuliana,
      gestationalAge: gaJuliana,
      status: 'ACTIVE',
      hasRedFlag: false,
      recentRedFlags: [],
      lastLogDate: formatToIsoDateString(new Date()),
    },
    {
      pregnancyId: 'p-mariana-04',
      pregnantUserId: '55555555-5555-5555-5555-555555555555',
      pregnantName: 'Mariana Costa',
      pregnantPhone: '(11) 97333-4455',
      babyNickname: 'Lucas',
      babyGender: 'MALE',
      effectiveDum: dumMariana,
      dppDate: dppMariana,
      gestationalAge: gaMariana,
      status: 'ACTIVE',
      hasRedFlag: false,
      recentRedFlags: [],
      lastLogDate: getPastDateIsoString(1),
    },
    {
      pregnancyId: 'p-beatriz-03',
      pregnantUserId: '66666666-6666-6666-6666-666666666666',
      pregnantName: 'Beatriz Almeida',
      pregnantPhone: '(11) 99444-5566',
      babyNickname: 'Gael',
      babyGender: 'SURPRISE',
      effectiveDum: dumBeatriz,
      dppDate: dppBeatriz,
      gestationalAge: gaBeatriz,
      status: 'ACTIVE',
      hasRedFlag: false,
      recentRedFlags: [],
      lastLogDate: getPastDateIsoString(2),
    },
  ];

  const redFlags: RedFlagAlertItem[] = [
    {
      logId: 'rf-camila-01',
      pregnancyId: 'p-camila-01',
      pregnantUserId: '22222222-2222-2222-2222-222222222222',
      pregnantName: 'Camila Santos',
      babyNickname: 'Maya',
      logDate: formatToIsoDateString(new Date()),
      gestationalWeek: gaCamila.weeks,
      gestationalDays: gaCamila.days,
      symptoms: ['CEFALEIA_VISAO_TURVA'],
      fetalMovement: 'NORMAL',
      reason: 'Cefaleia com alteração visual (visão turva) registrada hoje há 2 horas',
      createdAt: new Date().toISOString(),
    },
  ];

  return { clients, redFlags };
}

/**
 * Fetches Doula Dashboard data (active clients, red flag alerts, stats)
 */
export async function fetchDoulaDashboardData(doulaId?: string): Promise<DoulaDashboardData> {
  // 1. Get stored Doula Status if overridden locally
  const savedDoulaStatus = (await safeStorage.getItem(STORAGE_DOULA_STATUS_KEY)) as DoulaAvailability | null;

  // 2. Get list of acknowledged red flags from local storage
  const rawAck = await safeStorage.getItem(STORAGE_ACKNOWLEDGED_FLAGS_KEY);
  const acknowledgedFlags: string[] = rawAck ? JSON.parse(rawAck) : [];

  let doulaProfile: Profile = {
    id: doulaId || '11111111-1111-1111-1111-111111111111',
    role: 'DOULA',
    full_name: 'Helena Ramos',
    phone: '(11) 98765-4321',
    avatar_url: null,
    must_change_password: false,
    doula_status: savedDoulaStatus || 'ONLINE',
    doula_status_message: 'Disponível para acolhimento e consultas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try fetching doula profile from Supabase if doulaId provided
  if (doulaId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', doulaId).single();
      if (data) {
        doulaProfile = {
          ...data,
          doula_status: savedDoulaStatus || data.doula_status || 'ONLINE',
        } as Profile;
      }
    } catch {
      // Ignore network errors and continue with fallback
    }
  }

  // 3. Try to query Supabase for active pregnancies
  try {
    const { data: pregnanciesData, error } = await supabase
      .from('pregnancies')
      .select(`
        id,
        pregnant_user_id,
        status,
        effective_dum,
        dpp_date,
        profiles:pregnant_user_id (id, full_name, phone),
        babies (id, nickname, gender),
        daily_logs (id, log_date, has_red_flag, symptom_tags, fetal_movement, seen_by_doula_at)
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (!error && pregnanciesData && pregnanciesData.length > 0) {
      const clients: DoulaClientCardData[] = [];
      const activeRedFlags: RedFlagAlertItem[] = [];

      for (const p of pregnanciesData as any[]) {
        const ga = getGestationalAge(p.effective_dum);
        const pregnantProfile = p.profiles as { id: string; full_name: string; phone: string | null } | null;
        const baby = Array.isArray(p.babies) && p.babies.length > 0 ? p.babies[0] : null;
        const logs: any[] = Array.isArray(p.daily_logs) ? p.daily_logs : [];

        // Check for red flags not seen by doula and not locally acknowledged
        const unreadLogs = logs.filter(
          (l) => l.has_red_flag && !l.seen_by_doula_at && !acknowledgedFlags.includes(l.id)
        );

        const hasActiveRedFlag = unreadLogs.length > 0;

        for (const unreadLog of unreadLogs) {
          const symptomReasons: string[] = [];
          if (unreadLog.symptom_tags?.includes('SANGRAMENTO')) symptomReasons.push('Sangramento vaginal');
          if (unreadLog.symptom_tags?.includes('PERDA_LIQUIDO')) symptomReasons.push('Perda de líquido amniótico');
          if (unreadLog.symptom_tags?.includes('CEFALEIA_VISAO_TURVA'))
            symptomReasons.push('Cefaleia com alteração visual');
          if (unreadLog.fetal_movement === 'DECREASED' && ga.weeks >= 28)
            symptomReasons.push('Movimentação fetal diminuída (>= 28 sem)');

          const reason =
            symptomReasons.length > 0
              ? symptomReasons.join(', ')
              : 'Alerta obstétrico registrado no diário';

          activeRedFlags.push({
            logId: unreadLog.id,
            pregnancyId: p.id,
            pregnantUserId: p.pregnant_user_id,
            pregnantName: pregnantProfile?.full_name || 'Gestante',
            babyNickname: baby?.nickname || 'Bebê',
            logDate: unreadLog.log_date,
            gestationalWeek: ga.weeks,
            gestationalDays: ga.days,
            symptoms: unreadLog.symptom_tags || [],
            fetalMovement: unreadLog.fetal_movement || 'NORMAL',
            reason,
            createdAt: unreadLog.created_at || new Date().toISOString(),
          });
        }

        clients.push({
          pregnancyId: p.id,
          pregnantUserId: p.pregnant_user_id,
          pregnantName: pregnantProfile?.full_name || 'Gestante',
          pregnantPhone: pregnantProfile?.phone || null,
          babyNickname: baby?.nickname || 'Bebê',
          babyGender: baby?.gender || 'UNKNOWN',
          effectiveDum: p.effective_dum,
          dppDate: p.dpp_date,
          gestationalAge: ga,
          status: p.status,
          hasRedFlag: hasActiveRedFlag,
          recentRedFlags: unreadLogs.map((l) => ({
            id: l.id,
            logDate: l.log_date,
            reason: 'Alerta obstétrico registrado',
          })),
        });
      }

      // Stats
      const stats = {
        totalActive: clients.length,
        firstTrimester: clients.filter((c) => c.gestationalAge.trimester === 1).length,
        secondTrimester: clients.filter((c) => c.gestationalAge.trimester === 2).length,
        thirdTrimester: clients.filter((c) => c.gestationalAge.trimester === 3).length,
        redFlagsCount: activeRedFlags.length,
      };

      return {
        doula: doulaProfile,
        clients,
        activeRedFlags,
        stats,
      };
    }
  } catch {
    // Continue to mock fallback
  }

  // 4. Mock fallback with realistic gestational calculations
  const { clients: mockClients, redFlags: mockRedFlags } = getMockDoulaClients();

  // Filter out red flags that were acknowledged
  const filteredRedFlags = mockRedFlags.filter((rf) => !acknowledgedFlags.includes(rf.logId));

  // Check local storage for any dynamic red flags added to mock clients
  for (const client of mockClients) {
    try {
      const rawClientLogs = await safeStorage.getItem(`@minha_gestacao:daily_logs:${client.pregnancyId}`);
      if (rawClientLogs) {
        const parsedLogs: DailyLog[] = JSON.parse(rawClientLogs);
        for (const l of parsedLogs) {
          if (l.has_red_flag && !l.seen_by_doula_at && !acknowledgedFlags.includes(l.id)) {
            if (!filteredRedFlags.some((rf) => rf.logId === l.id)) {
              filteredRedFlags.push({
                logId: l.id,
                pregnancyId: client.pregnancyId,
                pregnantUserId: client.pregnantUserId,
                pregnantName: client.pregnantName,
                babyNickname: client.babyNickname,
                logDate: l.log_date,
                gestationalWeek: l.gestational_week_at_log,
                gestationalDays: l.gestational_days_at_log,
                symptoms: l.symptom_tags,
                fetalMovement: l.fetal_movement,
                reason: 'Alerta obstétrico prioritário registrado no diário',
                createdAt: l.created_at,
              });
            }
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  const clientData = mockClients.map((client) => ({
    ...client,
    hasRedFlag: filteredRedFlags.some((rf) => rf.pregnancyId === client.pregnancyId),
    recentRedFlags: filteredRedFlags
      .filter((rf) => rf.pregnancyId === client.pregnancyId)
      .map((rf) => ({ id: rf.logId, logDate: rf.logDate, reason: rf.reason })),
  }));

  const stats = {
    totalActive: clientData.length,
    firstTrimester: clientData.filter((c) => c.gestationalAge.trimester === 1).length,
    secondTrimester: clientData.filter((c) => c.gestationalAge.trimester === 2).length,
    thirdTrimester: clientData.filter((c) => c.gestationalAge.trimester === 3).length,
    redFlagsCount: filteredRedFlags.length,
  };

  return {
    doula: doulaProfile,
    clients: clientData,
    activeRedFlags: filteredRedFlags,
    stats,
  };
}

/**
 * Updates Doula availability status
 */
export async function updateDoulaAvailability(
  doulaId: string,
  status: DoulaAvailability,
  statusMessage?: string
): Promise<boolean> {
  try {
    await safeStorage.setItem(STORAGE_DOULA_STATUS_KEY, status);

    const { error } = await supabase
      .from('profiles')
      .update({
        doula_status: status,
        doula_status_message: statusMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doulaId);

    return !error;
  } catch {
    return true; // Local storage updated successfully
  }
}

/**
 * Acknowledges a red flag so it disappears from the priority alerts banner
 */
export async function acknowledgeRedFlag(logId: string): Promise<boolean> {
  try {
    // Save to local acknowledged list
    const rawAck = await safeStorage.getItem(STORAGE_ACKNOWLEDGED_FLAGS_KEY);
    const list: string[] = rawAck ? JSON.parse(rawAck) : [];
    if (!list.includes(logId)) {
      list.push(logId);
      await safeStorage.setItem(STORAGE_ACKNOWLEDGED_FLAGS_KEY, JSON.stringify(list));
    }

    // Try Supabase update
    await supabase
      .from('daily_logs')
      .update({ seen_by_doula_at: new Date().toISOString() })
      .eq('id', logId);

    return true;
  } catch {
    return true;
  }
}

/**
 * Builds mock home data for the pregnant user
 */
function getMockPregnantHomeData(profile: Profile): PregnantHomeData {
  // Default to ~24 weeks 3 days (171 days ago)
  const dum = getPastDateIsoString(171);
  const ga = getGestationalAge(dum);
  const dpp = formatToIsoDateString(calculateDpp(dum));
  const weekMetadata = getGestationalMetadata(ga.weeks);

  const mockPregnancy: Pregnancy = {
    id: 'mock-pregnancy-active',
    pregnant_user_id: profile.id,
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
    pre_pregnancy_weight_kg: 62.5,
    blood_type: 'O+',
    gravida_count: 1,
    vaginal_births_count: 0,
    cesarean_count: 0,
    abortions_count: 0,
    partner_name: 'Lucas Silva',
    partner_phone: '(11) 98888-7777',
    support_network_notes: 'Mãe e sogra próximas e disponíveis',
    health_conditions: null,
    medications_in_use: 'Ácido fólico, Ferro e Ômega 3',
    desired_birth_type: 'Parto Humanizado / Normal',
    target_maternity_hospital: 'Hospital e Maternidade Santa Joana',
    obstetrician_name: 'Dra. Vanessa Martins',
    doula_private_notes: 'Gestante tranquila, com foco em alívio natural da dor',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockBaby: Baby = {
    id: 'mock-baby-01',
    pregnancy_id: mockPregnancy.id,
    nickname: 'Theo',
    official_name: 'Theo Silva',
    gender: 'MALE',
    birth_datetime: null,
    birth_weight_g: null,
    birth_length_cm: null,
    apgar_1min: null,
    apgar_5min: null,
    birth_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockDoula: Profile = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'DOULA',
    full_name: 'Helena Ramos',
    phone: '(11) 98765-4321',
    avatar_url: null,
    must_change_password: false,
    doula_status: 'ONLINE',
    doula_status_message: 'Online para acolher você e tirar dúvidas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const todayStr = formatToIsoDateString(new Date());

  const mockTasks: CalendarItem[] = [
    {
      id: 'task-1',
      pregnancy_id: mockPregnancy.id,
      created_by: mockDoula.id,
      item_type: 'DAILY_TASK',
      title: 'Exercício na bola suíça (15 min de círculos pélvicos)',
      description: 'Movimentos lentos em 8 para relaxar o assoalho pélvico',
      scheduled_date: todayStr,
      start_time: null,
      end_time: null,
      video_room_url: null,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      pregnancy_id: mockPregnancy.id,
      created_by: mockDoula.id,
      item_type: 'DAILY_TASK',
      title: 'Hidratação: Beber 2,5 litros de água',
      description: 'Importante para a renovação adequada do líquido amniótico',
      scheduled_date: todayStr,
      start_time: null,
      end_time: null,
      video_room_url: null,
      is_completed: true,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      pregnancy_id: mockPregnancy.id,
      created_by: mockDoula.id,
      item_type: 'DAILY_TASK',
      title: 'Momento de conexão: Massagem suave no ventre',
      description: 'Use óleo de semente de uva e coloque uma música relaxante',
      scheduled_date: todayStr,
      start_time: null,
      end_time: null,
      video_room_url: null,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  const mockEvents: CalendarItem[] = [
    {
      id: 'event-1',
      pregnancy_id: mockPregnancy.id,
      created_by: mockDoula.id,
      item_type: 'VIDEO_CALL',
      title: 'Videochamada de Alinhamento Perinatal',
      description: 'Conversar sobre o plano de parto e esclarecer dúvidas',
      scheduled_date: todayStr,
      start_time: '16:00:00',
      end_time: '17:00:00',
      video_room_url: `https://meet.jit.si/MinhaGestacao-Theo-${mockPregnancy.id}`,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  return {
    profile,
    pregnancy: mockPregnancy,
    baby: mockBaby,
    doula: mockDoula,
    gestationalAge: ga,
    weekMetadata,
    todayLog: null,
    isTodayLogCompleted: false,
    todayTasks: mockTasks,
    upcomingEvents: mockEvents,
  };
}

/**
 * Fetches Home data for the logged-in pregnant user
 */
export async function fetchPregnantHomeData(pregnantProfile: Profile): Promise<PregnantHomeData> {
  const todayStr = formatToIsoDateString(new Date());

  // Load completed tasks status from local storage
  const rawCompletedTasks = await safeStorage.getItem(STORAGE_COMPLETED_TASKS_KEY);
  const completedTaskIds: string[] = rawCompletedTasks ? JSON.parse(rawCompletedTasks) : [];

  // Load Doula status from storage if altered in this session
  const savedDoulaStatus = (await safeStorage.getItem(STORAGE_DOULA_STATUS_KEY)) as DoulaAvailability | null;

  try {
    // 1. Fetch active pregnancy
    const { data: pregnancyData, error: pError } = await supabase
      .from('pregnancies')
      .select('*')
      .eq('pregnant_user_id', pregnantProfile.id)
      .eq('status', 'ACTIVE')
      .single();

    if (!pError && pregnancyData) {
      const ga = getGestationalAge(pregnancyData.effective_dum);

      // 2. Fetch Baby
      const { data: babyData } = await supabase
        .from('babies')
        .select('*')
        .eq('pregnancy_id', pregnancyData.id)
        .single();

      // 3. Fetch Doula Profile
      let doulaProfile: Profile | null = null;
      if (pregnancyData.doula_user_id) {
        const { data: doulaData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', pregnancyData.doula_user_id)
          .single();

        if (doulaData) {
          doulaProfile = {
            ...doulaData,
            doula_status: savedDoulaStatus || doulaData.doula_status || 'ONLINE',
          } as Profile;
        }
      }

      // 4. Fetch gestational week metadata (from table, falling back to local dictionary)
      let weekMeta = getGestationalMetadata(ga.weeks);
      try {
        const { data: metaData } = await supabase
          .from('gestational_weeks_metadata')
          .select('*')
          .eq('week_number', ga.weeks)
          .single();

        if (metaData) {
          weekMeta = metaData as GestationalWeekMetadata;
        }
      } catch {
        // Fallback already assigned
      }

      // 5. Fetch today's Daily Log
      const { data: todayLogData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('pregnancy_id', pregnancyData.id)
        .eq('log_date', todayStr)
        .single();

      // 6. Fetch today's Calendar items
      const { data: calendarData } = await supabase
        .from('calendar_items')
        .select('*')
        .eq('pregnancy_id', pregnancyData.id)
        .eq('scheduled_date', todayStr)
        .order('start_time', { ascending: true, nullsFirst: false });

      const allItems: CalendarItem[] = (calendarData || []).map((item) => ({
        ...item,
        is_completed: completedTaskIds.includes(item.id) || item.is_completed,
      }));

      const todayTasks = allItems.filter((i) => i.item_type === 'DAILY_TASK');
      const upcomingEvents = allItems.filter((i) => i.item_type !== 'DAILY_TASK');

      return {
        profile: pregnantProfile,
        pregnancy: pregnancyData as Pregnancy,
        baby: babyData ? (babyData as Baby) : null,
        doula: doulaProfile,
        gestationalAge: ga,
        weekMetadata: weekMeta,
        todayLog: todayLogData ? (todayLogData as DailyLog) : null,
        isTodayLogCompleted: Boolean(todayLogData),
        todayTasks,
        upcomingEvents,
      };
    }
  } catch {
    // Continue to mock fallback
  }

  // Fallback to mock data with dynamic calculations
  const fallback = getMockPregnantHomeData(pregnantProfile);

  // Sync saved doula status if available
  if (savedDoulaStatus && fallback.doula) {
    fallback.doula.doula_status = savedDoulaStatus;
  }

  // Sync today's daily log from local storage if available
  try {
    const pregnancyKey = `@minha_gestacao:daily_logs:${fallback.pregnancy?.id || 'mock-pregnancy-active'}`;
    const rawLogs = await safeStorage.getItem(pregnancyKey);
    if (rawLogs) {
      const logsList: DailyLog[] = JSON.parse(rawLogs);
      const foundToday = logsList.find((l) => l.log_date === todayStr);
      if (foundToday) {
        fallback.todayLog = foundToday;
        fallback.isTodayLogCompleted = true;
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  // Sync completed tasks
  fallback.todayTasks = fallback.todayTasks.map((t) => ({
    ...t,
    is_completed: completedTaskIds.includes(t.id) ? true : t.is_completed,
  }));

  return fallback;
}

/**
 * Toggles a task item completed status
 */
export async function toggleTaskCompletion(itemId: string, newCompletedStatus: boolean): Promise<boolean> {
  try {
    const rawCompletedTasks = await safeStorage.getItem(STORAGE_COMPLETED_TASKS_KEY);
    let list: string[] = rawCompletedTasks ? JSON.parse(rawCompletedTasks) : [];

    if (newCompletedStatus) {
      if (!list.includes(itemId)) list.push(itemId);
    } else {
      list = list.filter((id) => id !== itemId);
    }
    await safeStorage.setItem(STORAGE_COMPLETED_TASKS_KEY, JSON.stringify(list));

    await supabase
      .from('calendar_items')
      .update({
        is_completed: newCompletedStatus,
        completed_at: newCompletedStatus ? new Date().toISOString() : null,
      })
      .eq('id', itemId);

    return true;
  } catch {
    return true;
  }
}
