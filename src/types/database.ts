export type UserRole = 'DOULA' | 'PREGNANT';
export type CalcMethodType = 'DUM' | 'ULTRASOUND';
export type PregnancyStatus = 'ACTIVE' | 'BORN' | 'ARCHIVED';
export type BabyGender = 'MALE' | 'FEMALE' | 'SURPRISE' | 'UNKNOWN';
export type FetalMovementLevel = 'NOT_FEELING_YET' | 'DECREASED' | 'NORMAL' | 'VERY_ACTIVE';
export type CalendarItemType = 'VIDEO_CALL' | 'MEDICAL_EXAM' | 'DOULA_VISIT' | 'DAILY_TASK';
export type ChatMessageType = 'TEXT' | 'AUDIO' | 'IMAGE' | 'URGENT_ALERT';
export type DoulaAvailability = 'ONLINE' | 'IN_LABOR_SUPPORT' | 'RESTING';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  must_change_password: boolean;
  doula_status: DoulaAvailability;
  doula_status_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pregnancy {
  id: string;
  pregnant_user_id: string;
  doula_user_id: string;
  status: PregnancyStatus;
  calc_method: CalcMethodType;
  dum_date: string | null;
  ultrasound_date: string | null;
  ultrasound_weeks: number | null;
  ultrasound_days: number | null;
  effective_dum: string;
  dpp_date: string;
  height_cm: number | null;
  pre_pregnancy_weight_kg: number | null;
  blood_type: string | null;
  gravida_count: number;
  vaginal_births_count: number;
  cesarean_count: number;
  abortions_count: number;
  partner_name: string | null;
  partner_phone: string | null;
  support_network_notes: string | null;
  health_conditions: string | null;
  medications_in_use: string | null;
  desired_birth_type: string | null;
  target_maternity_hospital: string | null;
  obstetrician_name: string | null;
  doula_private_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Baby {
  id: string;
  pregnancy_id: string;
  nickname: string;
  official_name: string | null;
  gender: BabyGender;
  birth_datetime: string | null;
  birth_weight_g: number | null;
  birth_length_cm: number | null;
  apgar_1min: number | null;
  apgar_5min: number | null;
  birth_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  pregnancy_id: string;
  log_date: string;
  gestational_week_at_log: number;
  gestational_days_at_log: number;
  mood_tags: string[];
  symptom_tags: string[];
  fetal_movement: FetalMovementLevel;
  sleep_quality: number | null;
  hydration_level: number | null;
  nutrition_notes: string | null;
  mother_weight_kg: number | null;
  baby_estimated_weight_g: number | null;
  baby_percentile: number | null;
  blood_pressure: string | null;
  notes: string | null;
  belly_photo_url: string | null;
  has_red_flag: boolean;
  seen_by_doula_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarItem {
  id: string;
  pregnancy_id: string;
  created_by: string;
  item_type: CalendarItemType;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  video_room_url: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  pregnancy_id: string;
  sender_id: string;
  topic_tag: string | null;
  message_type: ChatMessageType;
  content: string | null;
  media_url: string | null;
  audio_duration_sec: number | null;
  read_at: string | null;
  created_at: string;
}

export interface GestationalWeekMetadata {
  week_number: number;
  trimester: 1 | 2 | 3;
  baby_size_comparison: string;
  illustration_key: string;
  avg_length_cm: number | null;
  avg_weight_g: number | null;
  baby_development_summary: string;
  mother_body_changes: string;
  doula_tip_of_week: string;
}
