import { FetalMovementLevel } from '@/types/database';

export interface MoodOption {
  value: string;
  label: string;
  emoji: string;
}

export interface SymptomOption {
  value: string;
  label: string;
  emoji: string;
  isRedFlag?: boolean;
  explanation?: string;
}

export interface FetalMovementOption {
  value: FetalMovementLevel;
  label: string;
  emoji: string;
  badge?: string;
  isWarning?: boolean;
}

export interface RatingOption {
  level: number;
  label: string;
  emoji: string;
  subtext?: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'TRANQUILA', label: 'Tranquila', emoji: '🌸' },
  { value: 'FELIZ', label: 'Feliz & Radiante', emoji: '✨' },
  { value: 'GRATA', label: 'Agradecida', emoji: '🙏' },
  { value: 'CONECTADA', label: 'Conectada ao bebê', emoji: '🤰' },
  { value: 'ANSIOSA', label: 'Ansiosa', emoji: '💭' },
  { value: 'CANSADA', label: 'Cansada', emoji: '🥱' },
  { value: 'SENSIVEL', label: 'Emotiva / Sensível', emoji: '🥺' },
  { value: 'SOBRECARREGADA', label: 'Sobrecarregada', emoji: '🌧️' },
  { value: 'INSEGURA', label: 'Com medos / Insegura', emoji: '🤍' },
];

export const COMMON_SYMPTOM_OPTIONS: SymptomOption[] = [
  { value: 'SEM_SINTOMAS', label: 'Sem queixas hoje', emoji: '✨' },
  { value: 'ENJOO', label: 'Enjoo / Náuseas', emoji: '🤢' },
  { value: 'AZIA', label: 'Azia / Queimação', emoji: '🔥' },
  { value: 'SONO_EXCESSIVO', label: 'Sono excessivo', emoji: '💤' },
  { value: 'DOR_LOMBAR', label: 'Dor nas costas / lombar', emoji: '⚡' },
  { value: 'INCHACO', label: 'Inchaço nos pés/pernas', emoji: '🦶' },
  { value: 'COLICA_LEVE', label: 'Cólica fisiológica leve', emoji: '🩺' },
  { value: 'SENSIBILIDADE_MAMAS', label: 'Sensibilidade nas mamas', emoji: '🌸' },
  { value: 'CAIMBRAS', label: 'Cãibras', emoji: '🦵' },
  { value: 'PRISAO_VENTRE', label: 'Constipação / Intestino preso', emoji: '🌿' },
  { value: 'FALTA_DE_AR', label: 'Falta de ar leve', emoji: '💨' },
];

export const CRITICAL_SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    value: 'SANGRAMENTO',
    label: 'Sangramento Vaginal',
    emoji: '🩸',
    isRedFlag: true,
    explanation: 'Qualquer sangramento vaginal, mesmo em pequenas quantidades ou tipo borra.',
  },
  {
    value: 'PERDA_LIQUIDO',
    label: 'Perda de Líquido Amniótico',
    emoji: '💧',
    isRedFlag: true,
    explanation: 'Líquido transparente e morno escorrendo involuntariamente pelas pernas.',
  },
  {
    value: 'CEFALEIA_VISAO_TURVA',
    label: 'Dor de Cabeça Forte + Visão Turva',
    emoji: '👁️',
    isRedFlag: true,
    explanation: 'Dor de cabeça persistente associada a pontos brilhantes (escotomas) ou visão turva.',
  },
];

export const ALL_SYMPTOM_OPTIONS: SymptomOption[] = [
  ...COMMON_SYMPTOM_OPTIONS,
  ...CRITICAL_SYMPTOM_OPTIONS,
];

export const FETAL_MOVEMENT_OPTIONS: FetalMovementOption[] = [
  {
    value: 'NORMAL',
    label: 'Normal / Mexeu bem',
    emoji: '👶',
    badge: 'Habitual',
  },
  {
    value: 'VERY_ACTIVE',
    label: 'Muito ativo / Vigoroso',
    emoji: '⚡',
    badge: 'Chutes frequentes',
  },
  {
    value: 'DECREASED',
    label: 'Mexeu menos que o normal',
    emoji: '⚠️',
    badge: 'Atenção (>= 28 sem)',
    isWarning: true,
  },
  {
    value: 'NOT_FEELING_YET',
    label: 'Ainda não sinto mexer',
    emoji: '🌱',
    badge: 'Normal antes de 20 sem',
  },
];

export const SLEEP_QUALITY_OPTIONS: RatingOption[] = [
  { level: 1, label: 'Péssimo / Insônia', emoji: '🌑', subtext: 'Muito acordada' },
  { level: 2, label: 'Ruim / Agitado', emoji: '🌘', subtext: 'Acordei várias vezes' },
  { level: 3, label: 'Regular', emoji: '🌗', subtext: 'Sono razoável' },
  { level: 4, label: 'Bom', emoji: '🌖', subtext: 'Descansei bem' },
  { level: 5, label: 'Excelente', emoji: '🌕', subtext: 'Sono revigorante' },
];

export const HYDRATION_LEVEL_OPTIONS: RatingOption[] = [
  { level: 1, label: '< 1 Litro', emoji: '💧', subtext: 'Pouca água' },
  { level: 2, label: '1L a 1.5L', emoji: '💧💧', subtext: 'Abaixo da meta' },
  { level: 3, label: '1.5L a 2L', emoji: '💧💧💧', subtext: 'Hidratação média' },
  { level: 4, label: '2L a 2.5L', emoji: '💧💧💧💧', subtext: 'Ótima ingestão' },
  { level: 5, label: '> 2.5L', emoji: '🌊', subtext: 'Meta batida!' },
];

export function getMoodLabel(value: string): string {
  const found = MOOD_OPTIONS.find((m) => m.value === value);
  return found ? `${found.emoji} ${found.label}` : value;
}

export function getSymptomLabel(value: string): string {
  const found = ALL_SYMPTOM_OPTIONS.find((s) => s.value === value);
  return found ? `${found.emoji} ${found.label}` : value;
}

export function getFetalMovementLabel(value: FetalMovementLevel): string {
  const found = FETAL_MOVEMENT_OPTIONS.find((f) => f.value === value);
  return found ? `${found.emoji} ${found.label}` : value;
}
