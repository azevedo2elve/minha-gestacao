# PROJECT SPECIFICATION: MINHA GESTAÇÃO (MVP)
> **Methodology:** Spec-Driven Development (SDD)
> **Target Platforms:** Android, iOS (Mobile Design) & Tablet/Desktop Web (Responsive Split-View Design for Doula)
> **Language:** Portuguese (pt-BR) for UI/UX, English for Code/Database Schema

---

## 1. PRODUCT VISION & DOMAIN CONTEXT
**Minha Gestação** é uma plataforma multi-plataforma para acompanhamento perinatal humanizado, conectando **Doulas** e suas **Gestantes**.
O sistema possui dois perfis de uso estritamente definidos (`RBAC`):
1. **`DOULA` (Admin/Especialista):** Utiliza o sistema prioritariamente em **Tablet** (durante consultas) e **Computador/Celular**. Realiza o cadastro guiado da gestante na primeira consulta (Anamnese), acompanha alertas clínicos/emocionais, lê os diários, atualiza dados evolutivos do bebê, prescreve exercícios/tarefas diárias, agenda consultas e realiza atendimento via chat e videochamada.
2. **`PREGNANT` (Cliente/Gestante):** Utiliza o sistema no **Celular (Android/iOS)**. Não realiza auto-cadastro; recebe o acesso pronto da Doula. Visualiza a evolução semanal do bebê com ilustrações, preenche o diário de sintomas/emoções/peso, cumpre tarefas diárias do calendário, acompanha gráficos de evolução e conversa com a doula por chat (texto/áudio/foto) e videochamada.

---

## 2. TECH STACK & ARCHITECTURE
- **Frontend Framework:** React Native with **Expo (SDK 52+)** + **Expo Router (v4)** + **TypeScript**.
- **Web/Tablet Support:** React Native Web (PWA ready) via Expo.
- **Styling:** **NativeWind (Tailwind CSS)** — uso obrigatório de design responsivo para adaptar a visão da Doula em telas maiores (`md:`, `lg:` / `useWindowDimensions`).
- **State & Data Fetching:** **TanStack Query (React Query v5)** para estado assíncrono/cache + **Zustand** para estado de sessão/UI.
- **Forms & Validation:** **React Hook Form** + **Zod**.
- **Charts:** `react-native-gifted-charts` (compatível com Mobile e Web).
- **Audio & Media:** `expo-av` (gravação e reprodução de áudio no chat) + `expo-image-picker`.
- **Video Calls:** Integração via **Jitsi Meet IFrame/SDK** ou **Daily.co** (salas geradas por agendamento).
- **Backend-as-a-Service (BaaS):** **Supabase**
  - **Database:** PostgreSQL 15+ com **Row Level Security (RLS)** habilitado em todas as tabelas.
  - **Auth:** Supabase Auth (Email/Password) + Flag de primeiro acesso (`must_change_password`).
  - **Serverless:** Supabase Edge Functions (Deno/TypeScript) para provisionamento de contas de gestantes pela Doula usando `service_role`.
  - **Realtime:** Supabase Realtime (`postgres_changes`) para o Chat e Alertas.
  - **Storage:** Buckets privados (`avatars`, `belly-photos`, `chat-media`).

---

## 3. DOCKER & LOCAL DEVELOPMENT ENVIRONMENT

### 3.1. `Dockerfile.dev`
```dockerfile
FROM node:20-alpine

RUN apk add --no-cache git bash curl python3 make g++

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm install

COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--web", "--lan"]
```

### 3.2. `docker-compose.yml`
```yaml
version: '3.9'

services:
  minha-gestacao-app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: minha_gestacao_app
    ports:
      - "8081:8081"     # Expo Web / Metro Bundler
      - "19000:19000"   # Expo DevTools
      - "19001:19001"
      - "19002:19002"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - EXPO_USE_METRO_WORKSPACE_ROOT=1
      # Substituir pelo IP local da máquina host na rede Wi-Fi para teste no celular/tablet
      - REACT_NATIVE_PACKAGER_HOSTNAME=${HOST_IP:-127.0.0.1}
      - EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
      - EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
    stdin_open: true
    tty: true
```
> **Nota de Infra:** O banco de dados e serviços do Supabase em desenvolvimento devem rodar via `npx supabase start` (que sobe os containers oficiais do Supabase local) ou apontando para um projeto de Dev no Supabase Cloud.

---

## 4. CORE BUSINESS RULES (REGRAS DE NEGÓCIO)

### RN01: Cálculo Obstétrico (Idade Gestacional - IG e DPP)
- **Duração Padrão da Gestação:** `280 dias` (40 semanas exatas).
- **Métodos de Entrada (Definidos na Anamnese pela Doula):**
  1. **Por DUM (`CALC_METHOD = 'DUM'`):**
     - `effective_dum = dum_date`
     - `dpp_date = effective_dum + 280 days`
  2. **Pelo 1º Ultrassom (`CALC_METHOD = 'ULTRASOUND'`):**
     - Recebe `ultrasound_date`, `us_weeks` e `us_days`.
     - Calcula a DUM corrigida retrocedendo os dias: `effective_dum = ultrasound_date - ((us_weeks * 7) + us_days) days`.
     - `dpp_date = effective_dum + 280 days`.
- **Cálculo Dinâmico Diário (Helper Function `getGestationalAge(effective_dum, targetDate = today)`):**
  - `totalDays = diffInDays(targetDate, effective_dum)`
  - `weeks = Math.floor(totalDays / 7)`
  - `days = totalDays % 7`
  - `daysRemaining = diffInDays(dpp_date, targetDate)`
  - `progressPercentage = Math.min(100, Math.round((totalDays / 280) * 100))`
- **Divisão de Trimestres:**
  - `1º Trimestre`: Semanas 0 a 13 (0 a 97 dias).
  - `2º Trimestre`: Semanas 14 a 27 (98 a 195 dias).
  - `3º Trimestre`: Semanas 28 a 42 (196+ dias).

### RN02: Provisionamento Doula-First (Sem Auto-Cadastro da Gestante)
- A tela de Login não possui botão público de "Criar Conta".
- A Doula realiza a primeira reunião (Anamnese) com a gestante e preenche o formulário em 5 passos.
- Ao submeter, uma Edge Function (`create-pregnant-client`) cria o usuário no `auth.users` com `must_change_password: true` no `user_metadata`, cria os registros em `profiles`, `pregnancies` e `babies`, e devolve uma senha temporária.
- O painel da Doula exibe um botão **"Enviar Acesso via WhatsApp"** usando deep link `https://wa.me/{phone}?text={encoded_welcome_message}`.

### RN03: Diário da Gestante (Upsert Diário e Propagação de Peso)
- Cada gestante possui no máximo **1 registro de diário por data (`UNIQUE(pregnancy_id, log_date)`)**.
- Salvar o diário no mesmo dia executa um `UPSERT` atualizando os dados existentes.
- Os campos `mother_weight_kg` e `baby_estimated_weight_g` são **opcionais (`NULLABLE`)**, pois a gestante não se pesa diariamente e só tem peso do bebê quando faz ultrassom.
- Na tela de **Timeline/Evolução**, o "Peso Atual" sempre consulta o último valor `NOT NULL` registrado (ou o peso pré-gestacional como ponto zero da mãe) e plota os gráficos ignorando os dias `NULL` (conectando os pontos válidos).

### RN04: Motor de Alertas (Red Flags Obstétricas)
- Se a gestante registrar no diário qualquer uma das seguintes condições:
  1. `symptom_tags` contendo `'SANGRAMENTO'`, `'PERDA_LIQUIDO'` ou `'CEFALEIA_VISAO_TURVA'`.
  2. `fetal_movement === 'DECREASED'` quando a Idade Gestacional for `>= 28 semanas`.
- **Ação do Sistema:**
  - Grava `has_red_flag = true` no registro do diário.
  - Exibe um modal acolhedor para a gestante orientando-a a avisar a doula/médico.
  - Destaca a gestante no topo do Dashboard da Doula na seção **"Atenção Prioritária"**.

---

## 5. DATABASE SCHEMA (POSTGRESQL / SUPABASE)

```sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('DOULA', 'PREGNANT');
CREATE TYPE calc_method_type AS ENUM ('DUM', 'ULTRASOUND');
CREATE TYPE pregnancy_status AS ENUM ('ACTIVE', 'BORN', 'ARCHIVED');
CREATE TYPE baby_gender AS ENUM ('MALE', 'FEMALE', 'SURPRISE', 'UNKNOWN');
CREATE TYPE fetal_movement_level AS ENUM ('NOT_FEELING_YET', 'DECREASED', 'NORMAL', 'VERY_ACTIVE');
CREATE TYPE calendar_item_type AS ENUM ('VIDEO_CALL', 'MEDICAL_EXAM', 'DOULA_VISIT', 'DAILY_TASK');
CREATE TYPE chat_msg_type AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'URGENT_ALERT');
CREATE TYPE doula_availability AS ENUM ('ONLINE', 'IN_LABOR_SUPPORT', 'RESTING');

-- 1. PROFILES
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

-- 2. PREGNANCIES (Ficha Obstétrica + Anamnese)
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
  effective_dum DATE NOT NULL, -- Base unificada para cálculos
  dpp_date DATE NOT NULL,
  
  -- Dados Físicos e Histórico Obstétrico (G/P/A)
  height_cm NUMERIC(5,2),
  pre_pregnancy_weight_kg NUMERIC(5,2),
  blood_type TEXT,
  gravida_count INT DEFAULT 1,      -- Gestações
  vaginal_births_count INT DEFAULT 0, -- Partos Normais
  cesarean_count INT DEFAULT 0,     -- Cesáreas
  abortions_count INT DEFAULT 0,    -- Abortos
  
  -- Rede de Apoio e Parto
  partner_name TEXT,
  partner_phone TEXT,
  support_network_notes TEXT,
  health_conditions TEXT,
  medications_in_use TEXT,
  desired_birth_type TEXT,
  target_maternity_hospital TEXT,
  obstetrician_name TEXT,
  doula_private_notes TEXT,         -- Visível APENAS para a Doula
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BABIES (Cadastro Evolutivo)
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

-- 4. DAILY LOGS (Diário da Gestante)
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

-- 5. CALENDAR ITEMS & PRESCRIPTIONS (Eventos, Videochamadas e Tarefas)
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

-- 6. CHAT MESSAGES
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregnancy_id UUID NOT NULL REFERENCES pregnancies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  topic_tag TEXT, -- 'DUVIDA', 'DESABAFO', 'EXAME', 'SINTOMA'
  message_type chat_msg_type NOT NULL DEFAULT 'TEXT',
  content TEXT,
  media_url TEXT,
  audio_duration_sec INT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STATIC REFERENCE: GESTATIONAL WEEKS METADATA (Semanas 1 a 42)
CREATE TABLE gestational_weeks_metadata (
  week_number INT PRIMARY KEY CHECK (week_number BETWEEN 1 AND 42),
  trimester INT NOT NULL CHECK (trimester BETWEEN 1 AND 3),
  baby_size_comparison TEXT NOT NULL, -- Ex: 'Abacate', 'Espiga de Milho'
  illustration_key TEXT NOT NULL,
  avg_length_cm NUMERIC(4,1),
  avg_weight_g INT,
  baby_development_summary TEXT NOT NULL,
  mother_body_changes TEXT NOT NULL,
  doula_tip_of_week TEXT NOT NULL
);
```

---

## 6. APPLICATION DIRECTORY STRUCTURE

```text
minha-gestacao/
├── src/
│   ├── app/
│   │   ├── _layout.tsx                 # Root Providers (QueryClient, AuthGuard)
│   │   ├── (auth)/
│   │   │   ├── login.tsx               # Login único
│   │   │   └── change-password.tsx     # Troca de senha no 1º acesso da Gestante
│   │   ├── (pregnant)/                 # Visão Mobile da Gestante (Bottom Tabs)
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx                # Semana atual, fruta, tarefas do dia, CTA Diário
│   │   │   ├── diary.tsx               # Registro diário por chips + peso opcional
│   │   │   ├── timeline.tsx            # Barra de nível 40 sem + Gráficos Mãe/Bebê
│   │   │   ├── calendar.tsx            # Agenda de exames, vídeo e checklist de exercícios
│   │   │   ├── chat.tsx                # Bate-papo Realtime + Player de Áudio + Video Call
│   │   │   └── profile.tsx             # Visualização dos dados e do bebê
│   │   └── (doula)/                    # Visão Responsiva da Doula (Tablet/Web/Mobile)
│   │       ├── _layout.tsx             # Sidebar fixa em telas >= 768px, Tabs no Mobile
│   │       ├── dashboard.tsx           # Cards das gestantes por IG + Red Flags
│   │       ├── new-anamnesis.tsx       # Wizard de 5 passos para cadastrar gestante
│   │       ├── inbox.tsx               # Central de mensagens de todas as gestantes
│   │       └── client/[id]/            # Prontuário 360º da Gestante
│   │           ├── index.tsx           # Visão Geral + Diários + Gráficos
│   │           ├── schedule.tsx        # Prescrever exercícios e agendar vídeo
│   │           └── anamnesis-edit.tsx  # Editar dados obstétricos e dados do bebê
│   ├── components/
│   │   ├── ui/                         # Botões, Chips, Cards, Modals, Inputs
│   │   ├── pregnant/                   # Componentes específicos da gestante
│   │   ├── doula/                      # Componentes específicos da doula
│   │   └── shared/                     # VideoCallModal, AudioRecorder, WeightChart
│   ├── lib/
│   │   ├── supabase.ts                 # Cliente Supabase configurado com AsyncStorage
│   │   └── obstetrics.ts               # Funções puras RN01 (Cálculo IG, DPP, Trimestre)
│   ├── hooks/                          # Custom hooks (usePregnancy, useDailyLog, useChat)
│   ├── stores/                         # Zustand stores (useAuthStore, useDoulaStore)
│   └── types/                          # Tipagens TypeScript espelhadas do Banco
├── supabase/
│   ├── migrations/                     # SQL Schema + RLS Policies
│   ├── seed.sql                        # Seed das 42 semanas (gestational_weeks_metadata)
│   └── functions/
│       └── create-pregnant-client/     # Edge Function para cadastro sem deslogar a Doula
├── Dockerfile.dev
├── docker-compose.yml
└── SPEC.md
```

---

## 7. FEATURE-BY-FEATURE IMPLEMENTATION ROADMAP (SDD)

> **Instrução para o Agente IA (Antigravity):** Implemente uma feature por vez na respectiva branch. Ao concluir cada feature, valide os Critérios de Aceite via testes unitários (`npm test`) e testes E2E no navegador com **Playwright** para inspeção. Os prints e artefatos de teste são temporários da branch e devem ser apagados após o merge da feature para a `main`.

### FEATURE 00: Foundation, Docker, Database & Obstetrics Engine
- **Escopo:**
  1. Inicializar projeto Expo com TypeScript, Expo Router e NativeWind.
  2. Configurar `Dockerfile.dev` e `docker-compose.yml`.
  3. Criar as migrations SQL no diretório `supabase/migrations/` com todas as tabelas, Enums e políticas de RLS.
  4. Criar o arquivo `supabase/seed.sql` populando `gestational_weeks_metadata` da semana 4 à 42 com tamanhos de frutas/sementes e textos em português.
  5. Implementar e testar `src/lib/obstetrics.ts` com funções puras para cálculo de IG (`weeks`, `days`), DPP, trimestre e porcentagem de evolução a partir da DUM ou Ultrassom.
  6. Criar a paleta de cores no `tailwind.config.js` (tons acolhedores: Terracota suave `#D97757`, Verde Sálvia `#6B8E78`, Creme `#FAF6F0`, Rosé `#E8B4B8`, Modo Escuro suave).
- **Critério de Aceite:** Funções de cálculo obstétrico passando nos testes de borda (DUM vs Ultrassom); banco estruturado; layouts vazios `(pregnant)` e `(doula)` respondendo ao tamanho da tela.

### FEATURE 01: Authentication, RBAC & First-Access Flow
- **Escopo:**
  1. Configurar cliente Supabase (`src/lib/supabase.ts`) e `useAuthStore`.
  2. Criar tela `(auth)/login.tsx`.
  3. Implementar roteamento automático no `src/app/_layout.tsx`:
     - Se `role === 'DOULA'` -> redireciona para `/(doula)/dashboard`.
     - Se `role === 'PREGNANT'` e `must_change_password === true` -> redireciona para `/(auth)/change-password`.
     - Se `role === 'PREGNANT'` e `must_change_password === false` -> redireciona para `/(pregnant)/home`.
  4. Criar tela `(auth)/change-password.tsx` que atualiza a senha no Supabase Auth e seta `profiles.must_change_password = false`.
- **Critério de Aceite:** Login funcionando para ambos os perfis e bloqueio de rotas cruzadas garantido.

### FEATURE 02: Doula Anamnesis Wizard & Client Provisioning
- **Escopo:**
  1. Criar a Supabase Edge Function `create-pregnant-client` que recebe o payload da anamnese, cria o usuário no Auth via `service_role`, insere `profiles`, `pregnancies` e `babies`, e retorna as credenciais geradas.
  2. Construir a tela `/(doula)/new-anamnesis.tsx` com Stepper de 5 passos otimizado para uso em Tablet e Web:
     - Passo 1: Identificação & Rede de Apoio.
     - Passo 2: Cálculo de IG/DPP (DUM ou Ultrassom) com preview em tempo real da semana atual e DPP na tela.
     - Passo 3: Histórico Obstétrico (G/PN/PC/A) e Saúde.
     - Passo 4: Desejos de Parto, Maternidade e Notas Privadas da Doula.
     - Passo 5: Dados iniciais do Bebê (Apelido, Sexo, Peso estimado se houver).
  3. Criar Modal de Sucesso ao finalizar com botão **"Enviar Acesso pelo WhatsApp"**.
- **Critério de Aceite:** A Doula consegue cadastrar uma gestante completa sem perder sua própria sessão de login e disparar o convite via WhatsApp.

### FEATURE 03: Dashboards (Visão da Doula & Home da Gestante)
- **Escopo:**
  1. **Painel da Doula (`/(doula)/dashboard.tsx`):**
     - Header com seletor de status da Doula (`Online`, `Em Parto`, `Descanso`).
     - Seção de Alertas (Red Flags não lidas).
     - Grid responsivo de Cards das gestantes ativas (1 coluna no mobile, 2 no tablet, 3 no desktop), exibindo Nome, Apelido do Bebê, Badge de IG (`Ex: 28s 4d`), DPP e botão para abrir o Prontuário.
  2. **Home da Gestante (`/(pregnant)/home.tsx`):**
     - Saudação personalizada com nome da mãe e apelido do bebê.
     - Card Hero consumindo `gestational_weeks_metadata` na semana atual (Ilustração, comparação com fruta, semanas + dias e contagem regressiva para DPP).
     - Botão de destaque para preencher/editar o Diário de Hoje.
     - Resumo de compromissos e checklist rápido das tarefas prescritas para hoje.
- **Critério de Aceite:** Ambos os dashboards exibindo dados reais calculados a partir de `effective_dum`.

### FEATURE 04: Diário da Gestante & Motor de Alertas
- **Escopo:**
  1. Construir `/(pregnant)/diary.tsx` com seletor de data no topo (permitindo ver/editar hoje ou dias passados).
  2. Implementar seletores de Chips interativos para Emoções e Sintomas Físicos.
  3. Implementar seletores para Movimentação Fetal, Qualidade do Sono (1-5) e Hidratação (1-5).
  4. Criar seção retrátil (Acordeão) para métricas opcionais: `Peso da Mãe (Kg)` e `Peso Estimado do Bebê (g)`.
  5. Implementar lógica de `UPSERT` na tabela `daily_logs` + verificação automática de Red Flags (RN04).
  6. Exibir o histórico de diários dentro do Prontuário da Cliente na visão da Doula (`/(doula)/client/[id]/index.tsx`).
- **Critério de Aceite:** Gestante consegue salvar e atualizar o diário do dia sem duplicar registros; sintomas críticos ativam a flag de alerta no painel da Doula.

### FEATURE 05: Timeline (Barra de Nível 40 Semanas) & Gráficos de Peso
- **Escopo:**
  1. Construir `/(pregnant)/timeline.tsx` (e espelhar componente no prontuário da Doula).
  2. **Barra de Nível Gestacional:** Trilha visual dividida em 1º, 2º e 3º Trimestres com marcos importantes (Semana 12, 20, 28, 37 "A Termo", 40 "DPP") e indicador da posição atual.
  3. **Painel e Gráficos de Peso:**
     - Card Peso da Mãe: Peso Pré-Gestacional, Último Peso registrado (com data relativa) e variação total (`+X.X kg`), acompanhado de gráfico de linha (`react-native-gifted-charts`) filtrando apenas registros onde `mother_weight_kg IS NOT NULL`.
     - Card Peso do Bebê: Último peso estimado em gramas/Kg e gráfico de evolução de crescimento.
  4. Na visão da Doula, adicionar modal **"Atualizar Cadastro do Bebê / Registrar Nascimento"** (para atualizar sexo, nome definitivo ou dados do parto).
- **Critério de Aceite:** Gráficos renderizando suavemente mesmo quando a gestante fica semanas sem preencher o peso no diário.

### FEATURE 06: Calendário, Prescrições de Exercícios & Videochamada
- **Escopo:**
  1. Construir tela de agenda da gestante (`/(pregnant)/calendar.tsx`) e aba de prescrições da doula (`/(doula)/client/[id]/schedule.tsx`).
  2. Permitir que a Doula crie **Tarefas/Exercícios** (ex: Bola suíça, Massagem perineal) e **Eventos/Videochamadas**.
  3. Quando o tipo for `VIDEO_CALL`, gerar automaticamente um identificador único de sala segura (`MinhaGestacao-${pregnancy_id}-${uuid}`) e construir o componente `VideoCallModal` (integrando Jitsi Meet via WebView/IFrame).
  4. Em telas de Tablet/Desktop da Doula, permitir abrir a videochamada em layout **Split-View** (vídeo à esquerda, ficha de anamnese/diário da gestante à direita).
- **Critério de Aceite:** Gestante consegue dar check nos exercícios diários e ambas conseguem entrar na mesma sala de vídeo pelo app/navegador.

### FEATURE 07: Bate-Papo Humanizado em Tempo Real (Texto, Áudio e Fotos)
- **Escopo:**
  1. Construir `/(pregnant)/chat.tsx` e `/(doula)/inbox.tsx` conectados via **Supabase Realtime** na tabela `chat_messages`.
  2. Exibir no topo do chat da gestante o status atual da Doula (`Online`, `Acompanhando um parto`, `Horário de descanso`).
  3. Permitir anexar tag de assunto opcional na mensagem (`Dúvida`, `Desabafo`, `Exame`, `Sintoma`).
  4. Implementar gravação de áudio (`expo-av`) e envio de imagem/foto de exame com upload para o bucket `chat-media` do Supabase Storage.
- **Critério de Aceite:** Mensagens de texto, áudios e imagens trafegando em tempo real entre o celular da gestante e o tablet/computador da Doula.