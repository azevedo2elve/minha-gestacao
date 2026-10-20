# 🗄️ Guia Completo do Supabase: Minha Gestação

Este guia detalha a arquitetura do banco de dados, como subir e sincronizar o Supabase no ambiente local ou na nuvem, como aplicar migrations e seeds, testar políticas de RLS e inserir registros de teste.

---

## 1. Visão Geral da Arquitetura do Banco

O banco de dados PostgreSQL 15+ do **Minha Gestação** conta com:
- **7 Tabelas Principais** com integridade referencial e triggers de `updated_at`.
- **8 Tipos Enumerados (`ENUM`)** para integridade de status e papéis.
- **Row Level Security (RLS)** ativo em 100% das tabelas.
- **Seed de Metadados Gestacionais** com 42 semanas completas.

### Diagrama Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ PREGNANCIES : "doula_user_id (Doula)"
    PROFILES ||--o{ PREGNANCIES : "pregnant_user_id (Gestante)"
    PROFILES ||--o{ CALENDAR_ITEMS : "created_by"
    PROFILES ||--o{ CHAT_MESSAGES : "sender_id"
    PREGNANCIES ||--o{ BABIES : "pregnancy_id"
    PREGNANCIES ||--o{ DAILY_LOGS : "pregnancy_id"
    PREGNANCIES ||--o{ CALENDAR_ITEMS : "pregnancy_id"
    PREGNANCIES ||--o{ CHAT_MESSAGES : "pregnancy_id"

    PROFILES {
        uuid id PK
        user_role role
        text full_name
        text phone
        text avatar_url
        boolean must_change_password
        doula_availability doula_status
    }

    PREGNANCIES {
        uuid id PK
        uuid pregnant_user_id FK
        uuid doula_user_id FK
        pregnancy_status status
        calc_method_type calc_method
        date effective_dum
        date dpp_date
        numeric height_cm
        numeric pre_pregnancy_weight_kg
        text blood_type
    }

    BABIES {
        uuid id PK
        uuid pregnancy_id FK
        text nickname
        text official_name
        baby_gender gender
        timestamptz birth_datetime
    }

    DAILY_LOGS {
        uuid id PK
        uuid pregnancy_id FK
        date log_date
        int gestational_week_at_log
        int gestational_days_at_log
        text[] mood_tags
        text[] symptom_tags
        fetal_movement_level fetal_movement
        boolean has_red_flag
        timestamptz seen_by_doula_at
    }

    CALENDAR_ITEMS {
        uuid id PK
        uuid pregnancy_id FK
        uuid created_by FK
        calendar_item_type item_type
        text title
        date scheduled_date
        boolean is_completed
    }

    CHAT_MESSAGES {
        uuid id PK
        uuid pregnancy_id FK
        uuid sender_id FK
        chat_msg_type message_type
        text content
        text media_url
        timestamptz read_at
    }

    GESTATIONAL_WEEKS_METADATA {
        int week_number PK
        int trimester
        text baby_size_comparison
        text illustration_key
        numeric avg_length_cm
        int avg_weight_g
    }
```

---

## 2. Opção A: Ambiente Supabase Local (Docker)

O Supabase CLI executa uma réplica completa dos serviços do Supabase (PostgreSQL, GoTrue/Auth, Storage, PostgREST, Inbucket e Studio Web) dentro de containers Docker.

### Pré-requisitos
- Docker Engine & Docker Compose rodando na máquina.
- Node.js 20+.

### 2.1. Iniciar o Supabase Local
Na raiz do projeto:

```bash
# Iniciar todos os serviços do Supabase local
npx supabase start
```

Ao concluir, o terminal exibirá as credenciais locais:
```text
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
anon key: eyJhbGci...
service_role key: eyJhbGci...
```

### 2.2. Acessar o Dashboard Local (Supabase Studio)
Abra no navegador: [http://localhost:54323](http://localhost:54323)

### 2.3. Aplicar Migrations e Seeds
O comando abaixo aplica todas as migrations em `supabase/migrations/` e popula a tabela com `supabase/seed.sql`:

```bash
# Reseta o banco, aplica migrations e executa o seed.sql
npx supabase db reset
```

### 2.4. Parar os Serviços
```bash
npx supabase stop
```

---

## 3. Opção B: Conectar a um Projeto no Supabase Cloud

Se preferir usar o serviço gerenciado gratuito na nuvem:

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Anote o `Project Reference ID` (encontrado em *Project Settings* > *General*).
3. No terminal do projeto, faça login e conecte o repositório:

```bash
# Login no Supabase CLI
npx supabase login

# Vincular ao seu projeto na nuvem
npx supabase link --project-ref SEU_PROJECT_REF

# Enviar as migrations para o banco na nuvem
npx supabase db push

# Executar o seed na nuvem (via SQL Editor no Studio ou comando):
npx supabase db remote commit
```

4. Copie a `Project URL` e a `anon key` para o seu arquivo `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Inserindo Dados de Teste Manualmente (SQL)

Você pode executar os comandos abaixo tanto no **Supabase Studio local** ([http://localhost:54323](http://localhost:54323)) quanto no **SQL Editor** do Supabase Cloud.

### 4.1. Criar Usuários no Auth e Profiles (Doula e Gestante)

```sql
-- 1. Cria a Doula Helena no Auth
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'doula.helena@minhagestacao.app',
  '{"role": "DOULA", "full_name": "Helena Ramos"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Cria o Perfil da Doula
INSERT INTO public.profiles (id, role, full_name, phone, doula_status, must_change_password)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'DOULA',
  'Helena Ramos',
  '(11) 98765-4321',
  'ONLINE',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- 3. Cria a Gestante Camila no Auth
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'camila.santos@exemplo.com',
  '{"role": "PREGNANT", "full_name": "Camila Santos"}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Cria o Perfil da Gestante
INSERT INTO public.profiles (id, role, full_name, phone, must_change_password)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'PREGNANT',
  'Camila Santos',
  '(11) 91234-5678',
  FALSE
) ON CONFLICT (id) DO NOTHING;
```

### 4.2. Criar Ficha Obstétrica (`pregnancies`) e Bebê (`babies`)

```sql
-- Cria a gestação associando Camila (gestante) e Helena (doula)
-- DUM calculada para 20 semanas atrás
INSERT INTO public.pregnancies (
  id,
  pregnant_user_id,
  doula_user_id,
  status,
  calc_method,
  dum_date,
  effective_dum,
  dpp_date,
  height_cm,
  pre_pregnancy_weight_kg,
  blood_type,
  gravida_count,
  vaginal_births_count,
  cesarean_count,
  abortions_count,
  partner_name,
  desired_birth_type,
  target_maternity_hospital
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ACTIVE',
  'DUM',
  CURRENT_DATE - INTERVAL '140 days',
  CURRENT_DATE - INTERVAL '140 days',
  CURRENT_DATE - INTERVAL '140 days' + INTERVAL '280 days',
  165.0,
  62.5,
  'O+',
  1,
  0,
  0,
  0,
  'Lucas Santos',
  'Parto Normal Humanizado',
  'Hospital Maternidade São Luiz'
);

-- Cadastra o bebê inicial
INSERT INTO public.babies (
  pregnancy_id,
  nickname,
  gender
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Maya',
  'FEMALE'
);
```

### 4.3. Criar Diário do Dia com Red Flag (`daily_logs`)

```sql
-- Diário com relato de dor de cabeça forte (ativa Red Flag automaticamente)
INSERT INTO public.daily_logs (
  pregnancy_id,
  log_date,
  gestational_week_at_log,
  gestational_days_at_log,
  mood_tags,
  symptom_tags,
  fetal_movement,
  sleep_quality,
  hydration_level,
  mother_weight_kg,
  has_red_flag,
  notes
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  CURRENT_DATE,
  20,
  0,
  ARRAY['Cansada', 'Sensível'],
  ARRAY['CEFALEIA_VISAO_TURVA', 'AZIA'],
  'NORMAL',
  2,
  3,
  66.2,
  TRUE,
  'Acordei com dor de cabeça e pontinhos brilhantes na visão.'
);
```

### 4.4. Criar Tarefa no Calendário (`calendar_items`)

```sql
INSERT INTO public.calendar_items (
  pregnancy_id,
  created_by,
  item_type,
  title,
  description,
  scheduled_date,
  start_time,
  is_completed
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'DAILY_TASK',
  'Mobilidade Pélvica na Bola',
  '15 minutos de círculos suaves e respiração diafragmática',
  CURRENT_DATE,
  '10:00:00',
  FALSE
);
```

---

## 5. Como Testar Políticas de RLS (Row Level Security)

Para simular o acesso como se fosse um usuário autenticado específico no SQL Editor:

```sql
-- Simula a sessão da Gestante Camila (ID 2222...)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

-- 1. Deve retornar apenas o perfil da Camila e da sua doula
SELECT * FROM public.profiles;

-- 2. Deve retornar apenas a sua própria gestação
SELECT * FROM public.pregnancies;

-- 3. Deve retornar os diários apenas dela
SELECT * FROM public.daily_logs;

-- Retornar ao papel administrativo do postgres
RESET ROLE;
```

---

## 6. Configuração dos Buckets de Storage

No Supabase Studio (aba *Storage*), crie os seguintes buckets:

1. **`avatars`**:
   - Tipo: **Público**
   - Propósito: Fotos de perfil de doulas e gestantes.
2. **`belly-photos`**:
   - Tipo: **Privado**
   - Propósito: Fotos da barriga enviadas nos diários diários.
3. **`chat-media`**:
   - Tipo: **Privado**
   - Propósito: Áudios gravados (`.m4a`/`.aac`) e fotos de exames anexadas nas conversas.

### Políticas de RLS para os Buckets Privados:
```sql
-- Permite download se pertencer à gravidez
CREATE POLICY "Permitir leitura de fotos da barriga para participantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'belly-photos' AND
  auth.role() = 'authenticated'
);

-- Permite upload de mídia no chat
CREATE POLICY "Permitir upload no chat para participantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.role() = 'authenticated'
);
```
