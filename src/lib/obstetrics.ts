/**
 * Minha Gestação - Motor de Cálculo Obstétrico (RN01 & RN04)
 * Pure functions for gestational age, due date (DPP), trimesters and red flags.
 * Timezone-safe UTC calculations.
 */

export const GESTATION_TOTAL_DAYS = 280; // 40 semanas exatas

export type CalcMethod = 'DUM' | 'ULTRASOUND';

export interface GestationalAgeResult {
  totalDays: number;
  weeks: number;
  days: number;
  dppDate: Date;
  daysRemaining: number;
  progressPercentage: number;
  trimester: 1 | 2 | 3;
  formatted: string;
  formattedShort: string;
  isPreTerm: boolean;
  isFullTerm: boolean;
  isPostTerm: boolean;
}

export interface UltrasoundInput {
  ultrasoundDate: string | Date;
  weeks: number;
  days: number;
}

/**
 * Normalizes any string 'YYYY-MM-DD', ISO string, or Date into a UTC midnight Date.
 * Avoids timezone shift bugs when calculating difference between calendar days.
 */
export function normalizeToUtcDate(input: string | Date): Date {
  if (typeof input === 'string') {
    // If format is YYYY-MM-DD
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    const parsed = new Date(input);
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 0, 0, 0, 0));
  }

  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Returns YYYY-MM-DD representation of a UTC date.
 */
export function formatToIsoDateString(input: string | Date): string {
  const d = normalizeToUtcDate(input);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns difference in whole days between two dates (dateLater - dateEarlier).
 */
export function diffInDays(dateLater: string | Date, dateEarlier: string | Date): number {
  const dLater = normalizeToUtcDate(dateLater);
  const dEarlier = normalizeToUtcDate(dateEarlier);
  const diffMs = dLater.getTime() - dEarlier.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Adds or subtracts days from a given date.
 */
export function addDays(date: string | Date, days: number): Date {
  const d = normalizeToUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Calculates effective DUM from standard DUM date.
 */
export function calculateEffectiveDumFromDum(dumDate: string | Date): Date {
  return normalizeToUtcDate(dumDate);
}

/**
 * Calculates corrected DUM retroceding days from 1st ultrasound:
 * effective_dum = ultrasound_date - ((us_weeks * 7) + us_days) days.
 */
export function calculateEffectiveDumFromUltrasound(
  ultrasoundDate: string | Date,
  usWeeks: number,
  usDays: number = 0
): Date {
  const totalDaysPassed = Math.floor(usWeeks * 7) + Math.floor(usDays);
  return addDays(ultrasoundDate, -totalDaysPassed);
}

/**
 * Calculates DPP (Data Provável do Parto):
 * dpp_date = effective_dum + 280 days
 */
export function calculateDpp(effectiveDum: string | Date): Date {
  return addDays(effectiveDum, GESTATION_TOTAL_DAYS);
}

/**
 * Computes trimester given weeks or total days:
 * - 1º Trimestre: Semanas 0 a 13 (0 a 97 dias)
 * - 2º Trimestre: Semanas 14 a 27 (98 a 195 dias)
 * - 3º Trimestre: Semanas 28 a 42+ (196+ dias)
 */
export function getTrimester(weeks: number): 1 | 2 | 3 {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

/**
 * Formats gestational age into user-friendly Portuguese:
 * e.g., 28 semanas e 4 dias
 */
export function formatGestationalAge(weeks: number, days: number): string {
  const safeWeeks = Math.max(0, weeks);
  const safeDays = Math.max(0, Math.min(6, days));
  const weekLabel = safeWeeks === 1 ? '1 semana' : `${safeWeeks} semanas`;
  const dayLabel = safeDays === 1 ? '1 dia' : `${safeDays} dias`;

  if (safeDays === 0) return weekLabel;
  return `${weekLabel} e ${dayLabel}`;
}

/**
 * Formats gestational age into compact representation:
 * e.g., 28s 4d
 */
export function formatGestationalAgeShort(weeks: number, days: number): string {
  const safeWeeks = Math.max(0, weeks);
  const safeDays = Math.max(0, Math.min(6, days));
  return `${safeWeeks}s ${safeDays}d`;
}

/**
 * RN01: Dynamic Gestational Age Calculator
 * Computes weeks, days, DPP, remaining days, trimester, and progress percentage.
 */
export function getGestationalAge(
  effectiveDum: string | Date,
  targetDate: string | Date = new Date()
): GestationalAgeResult {
  const normDum = normalizeToUtcDate(effectiveDum);
  const normTarget = normalizeToUtcDate(targetDate);
  const dppDate = calculateDpp(normDum);

  const totalDays = diffInDays(normTarget, normDum);
  const safeDays = Math.max(0, totalDays);

  const weeks = Math.floor(safeDays / 7);
  const days = safeDays % 7;
  const daysRemaining = diffInDays(dppDate, normTarget);

  const progressPercentage = Math.min(100, Math.max(0, Math.round((totalDays / GESTATION_TOTAL_DAYS) * 100)));
  const trimester = getTrimester(weeks);

  const isPreTerm = weeks < 37;
  const isFullTerm = weeks >= 37 && weeks < 42;
  const isPostTerm = weeks >= 42;

  return {
    totalDays,
    weeks,
    days,
    dppDate,
    daysRemaining,
    progressPercentage,
    trimester,
    formatted: formatGestationalAge(weeks, days),
    formattedShort: formatGestationalAgeShort(weeks, days),
    isPreTerm,
    isFullTerm,
    isPostTerm,
  };
}

/**
 * RN04: Check if daily symptoms or fetal movement trigger an Obstetric Red Flag.
 * Criteria:
 * 1. symptom_tags contains 'SANGRAMENTO', 'PERDA_LIQUIDO', or 'CEFALEIA_VISAO_TURVA'
 * 2. fetal_movement === 'DECREASED' when gestational week >= 28
 */
export const CRITICAL_RED_FLAG_SYMPTOMS = [
  'SANGRAMENTO',
  'PERDA_LIQUIDO',
  'CEFALEIA_VISAO_TURVA',
] as const;

export function hasObstetricRedFlag(params: {
  symptomTags?: string[] | null;
  fetalMovement?: string | null;
  gestationalWeeks?: number | null;
}): boolean {
  const { symptomTags = [], fetalMovement, gestationalWeeks = 0 } = params;

  if (symptomTags && symptomTags.length > 0) {
    const hasCriticalSymptom = symptomTags.some((tag) =>
      CRITICAL_RED_FLAG_SYMPTOMS.includes(tag as (typeof CRITICAL_RED_FLAG_SYMPTOMS)[number])
    );
    if (hasCriticalSymptom) {
      return true;
    }
  }

  if (fetalMovement === 'DECREASED' && (gestationalWeeks ?? 0) >= 28) {
    return true;
  }

  return false;
}
