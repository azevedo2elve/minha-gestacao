-- Supabase Initial Schema for Minha Gestação
-- Enums, Tables, Constraints, Indexes, Triggers and RLS Policies

-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE user_role AS ENUM ('DOULA', 'PREGNANT');
CREATE TYPE calc_method_type AS ENUM ('DUM', 'ULTRASOUND');
CREATE TYPE pregnancy_status AS ENUM ('ACTIVE', 'BORN', 'ARCHIVED');
CREATE TYPE baby_gender AS ENUM ('MALE', 'FEMALE', 'SURPRISE', 'UNKNOWN');
CREATE TYPE fetal_movement_level AS ENUM ('NOT_FEELING_YET', 'DECREASED', 'NORMAL', 'VERY_ACTIVE');
CREATE TYPE calendar_item_type AS ENUM ('VIDEO_CALL', 'MEDICAL_EXAM', 'DOULA_VISIT', 'DAILY_TASK');
CREATE TYPE chat_msg_type AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'URGENT_ALERT');
CREATE TYPE doula_availability AS ENUM ('ONLINE', 'IN_LABOR_SUPPORT', 'RESTING');

-- ==========================================
-- 2. HELPER FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. TABLES
-- ==========================================

-- 3.1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'PREGNANT',
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  must_change_password BOOLEAN DEFAULT TRUE,
  doula_status doula_availability DEFAULT 'ONLINE',
  doula_status_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2. PREGNANCIES
CREATE TABLE pregnancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnant_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doula_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status pregnancy_status NOT NULL DEFAULT 'ACTIVE',
  
  -- Cálculo Obstétrico
  calc_method calc_method_type NOT NULL DEFAULT 'DUM',
  dum_date DATE,
  ultrasound_date DATE,
  ultrasound_weeks INT,
  ultrasound_days INT,
  effective_dum DATE NOT NULL,
  dpp_date DATE NOT NULL,
  
  -- Dados Físicos e Histórico Obstétrico (G/P/A)
  height_cm NUMERIC(5,2),
  pre_pregnancy_weight_kg NUMERIC(5,2),
  blood_type TEXT,
  gravida_count INT DEFAULT 1,
  vaginal_births_count INT DEFAULT 0,
  cesarean_count INT DEFAULT 0,
  abortions_count INT DEFAULT 0,
  
  -- Rede de Apoio e Parto
  partner_name TEXT,
  partner_phone TEXT,
  support_network_notes TEXT,
  health_conditions TEXT,
  medications_in_use TEXT,
  desired_birth_type TEXT,
  target_maternity_hospital TEXT,
  obstetrician_name TEXT,
  doula_private_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3. BABIES
CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT 'Bebê',
  official_name TEXT,
  gender baby_gender DEFAULT 'UNKNOWN',
  birth_datetime TIMESTAMPTZ,
  birth_weight_g INT,
  birth_length_cm NUMERIC(4,1),
  apgar_1min INT,
  apgar_5min INT,
  birth_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4. DAILY LOGS
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gestational_week_at_log INT NOT NULL,
  gestational_days_at_log INT NOT NULL,
  
  mood_tags TEXT[] DEFAULT '{}',
  symptom_tags TEXT[] DEFAULT '{}',
  fetal_movement fetal_movement_level DEFAULT 'NORMAL',
  sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 5),
  hydration_level INT CHECK (hydration_level BETWEEN 1 AND 5),
  nutrition_notes TEXT,
  
  -- Métricas Opcionais (Não diárias)
  mother_weight_kg NUMERIC(5,2),
  baby_estimated_weight_g INT,
  baby_percentile INT,
  blood_pressure TEXT,
  
  notes TEXT,
  belly_photo_url TEXT,
  has_red_flag BOOLEAN DEFAULT FALSE,
  seen_by_doula_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pregnancy_id, log_date)
);

-- 3.5. CALENDAR ITEMS
CREATE TABLE calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  item_type calendar_item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  video_room_url TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6. CHAT MESSAGES
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  topic_tag TEXT,
  message_type chat_msg_type NOT NULL DEFAULT 'TEXT',
  content TEXT,
  media_url TEXT,
  audio_duration_sec INT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7. GESTATIONAL WEEKS METADATA
CREATE TABLE gestational_weeks_metadata (
  week_number INT PRIMARY KEY CHECK (week_number BETWEEN 1 AND 42),
  trimester INT NOT NULL CHECK (trimester BETWEEN 1 AND 3),
  baby_size_comparison TEXT NOT NULL,
  illustration_key TEXT NOT NULL,
  avg_length_cm NUMERIC(4,1),
  avg_weight_g INT,
  baby_development_summary TEXT NOT NULL,
  mother_body_changes TEXT NOT NULL,
  doula_tip_of_week TEXT NOT NULL
);

-- ==========================================
-- 4. INDEXES
-- ==========================================
CREATE INDEX idx_pregnancies_pregnant_user ON pregnancies(pregnant_user_id);
CREATE INDEX idx_pregnancies_doula_user ON pregnancies(doula_user_id);
CREATE INDEX idx_pregnancies_status ON pregnancies(status);
CREATE INDEX idx_babies_pregnancy ON babies(pregnancy_id);
CREATE INDEX idx_daily_logs_pregnancy_date ON daily_logs(pregnancy_id, log_date DESC);
CREATE INDEX idx_daily_logs_red_flag ON daily_logs(has_red_flag) WHERE has_red_flag = TRUE;
CREATE INDEX idx_calendar_items_pregnancy_date ON calendar_items(pregnancy_id, scheduled_date);
CREATE INDEX idx_chat_messages_pregnancy_created ON chat_messages(pregnancy_id, created_at DESC);

-- ==========================================
-- 5. TRIGGERS
-- ==========================================
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TRIGGER trg_pregnancies_updated_at
  BEFORE UPDATE ON pregnancies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TRIGGER trg_babies_updated_at
  BEFORE UPDATE ON babies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

CREATE TRIGGER trg_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestational_weeks_metadata ENABLE ROW LEVEL SECURITY;

-- 6.1. PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Doulas can read profiles of their pregnant clients"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.doula_user_id = auth.uid() AND p.pregnant_user_id = profiles.id
    )
  );

CREATE POLICY "Pregnants can read profiles of their assigned doula"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.pregnant_user_id = auth.uid() AND p.doula_user_id = profiles.id
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6.2. PREGNANCIES POLICIES
CREATE POLICY "Users can view pregnancy if they are the pregnant client or the doula"
  ON pregnancies FOR SELECT
  USING (pregnant_user_id = auth.uid() OR doula_user_id = auth.uid());

CREATE POLICY "Doulas can insert pregnancy records"
  ON pregnancies FOR INSERT
  WITH CHECK (doula_user_id = auth.uid());

CREATE POLICY "Doulas and pregnant clients can update pregnancy"
  ON pregnancies FOR UPDATE
  USING (pregnant_user_id = auth.uid() OR doula_user_id = auth.uid())
  WITH CHECK (pregnant_user_id = auth.uid() OR doula_user_id = auth.uid());

-- 6.3. BABIES POLICIES
CREATE POLICY "Users can view baby if they are part of the pregnancy"
  ON babies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = babies.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert baby if they are part of the pregnancy"
  ON babies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = babies.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update baby if they are part of the pregnancy"
  ON babies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = babies.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

-- 6.4. DAILY LOGS POLICIES
CREATE POLICY "Users can view daily logs of their pregnancy"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = daily_logs.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Pregnant client can insert daily log"
  ON daily_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = daily_logs.pregnancy_id AND p.pregnant_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update daily log"
  ON daily_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = daily_logs.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

-- 6.5. CALENDAR ITEMS POLICIES
CREATE POLICY "Participants can view calendar items"
  ON calendar_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = calendar_items.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert calendar items"
  ON calendar_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = calendar_items.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update calendar items"
  ON calendar_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = calendar_items.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Doulas can delete calendar items"
  ON calendar_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = calendar_items.pregnancy_id AND p.doula_user_id = auth.uid()
    )
  );

-- 6.6. CHAT MESSAGES POLICIES
CREATE POLICY "Participants can view chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = chat_messages.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert chat messages as themselves"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = chat_messages.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update chat messages (read receipt)"
  ON chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pregnancies p
      WHERE p.id = chat_messages.pregnancy_id AND (p.pregnant_user_id = auth.uid() OR p.doula_user_id = auth.uid())
    )
  );

-- 6.7. GESTATIONAL WEEKS METADATA POLICIES
CREATE POLICY "Gestational metadata readable by anyone"
  ON gestational_weeks_metadata FOR SELECT
  USING (true);
