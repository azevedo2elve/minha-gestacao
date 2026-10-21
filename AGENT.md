# AGENT CONTEXT: MINHA GESTAÇÃO

Este documento serve como guia de onboarding imediato para Agentes de IA que operam no repositório **Minha Gestação**. Leia este arquivo com atenção antes de implementar qualquer funcionalidade.

---

## 1. Visão Geral do Produto & Domínio

**Minha Gestação** é uma plataforma perinatal humanizada que conecta **Doulas** às suas **Gestantes**.
O produto adota estritamente a metodologia **Spec-Driven Development (SDD)**, com todas as regras de negócio definidas em [`SPEC.md`](file:///home/azevedo/code/minha-gestacao/SPEC.md).

### Dois Perfis de Usuário (`RBAC` Estrito)
1. **`DOULA` (Especialista/Admin):**
   - Dispositivos: Prioritariamente **Tablet** (consultas presenciais) e **Computador/Web**, além de celular.
   - Responsabilidades: Cadastra a gestante via Anamnese (5 passos), monitora alertas críticos (**Red Flags**), acompanha gráficos de peso, prescreve exercícios e tarefas no calendário, gerencia salas de vídeo e atende por chat.
   - Layout: **Split-View / Sidebar fixa** em telas `>= 768px` (`md:`, `lg:`), adaptando para abas/drawer no mobile.

2. **`PREGNANT` (Cliente/Gestante):**
   - Dispositivos: **Celular (Android/iOS)** mobile-first.
   - Responsabilidades: Não realiza auto-cadastro (recebe acesso pronto da Doula). Preenche diário de sintomas/emoções/peso, cumpre checklist diário de exercícios, visualiza evolução semanal do bebê e conversa com a doula.
   - Layout: **Bottom Tabs** (`Início`, `Diário`, `Evolução`, `Agenda`, `Doula`, `Perfil`).

---

## 2. Tech Stack & Diretrizes Técnicas

- **Framework:** React Native com **Expo (SDK 52)** + **Expo Router (v4)** + **TypeScript**.
- **Estilização:** **NativeWind v4** (Tailwind CSS v3) + classes utilitárias responsivas (`sm:`, `md:`, `lg:`).
- **Paleta de Cores:**
  - Terracota suave: `terracotta` (`#D97757`)
  - Verde Sálvia: `sage` (`#6B8E78`)
  - Creme: `cream` (`#FAF6F0`)
  - Rosé: `rose` (`#E8B4B8`)
  - Dark Mode: `dark-bg` (`#181A1B`), `dark-card` (`#23272A`), `dark-border` (`#363C40`)
- **Backend:** **Supabase** (PostgreSQL 15+, Supabase Auth, Row Level Security em todas as tabelas, Realtime e Storage).
- **Estado:** **TanStack Query (React Query v5)** para chamadas e cache assíncrono + **Zustand** para sessão e estado de UI.
- **Formulários:** **React Hook Form** + **Zod**.
- **Testes:** **Jest** + **ts-jest** (unitários) e **Playwright** (testes ponta a ponta / E2E no navegador).

---

## 3. Regras de Negócio Críticas (Não Modificar sem Alinhamento)

### RN01: Motor Obstétrico (`src/lib/obstetrics.ts`)
- **Duração Padrão:** 280 dias (40 semanas).
- **Entrada por DUM:** `effective_dum = dum_date` | `dpp_date = effective_dum + 280 dias`.
- **Entrada por Ultrassom:** `effective_dum = ultrasound_date - ((us_weeks * 7) + us_days) dias` | `dpp_date = effective_dum + 280 dias`.
- **Aritmética de Datas:** Deve ser **sempre UTC** usando `normalizeToUtcDate` para evitar bugs de fuso horário / horário de verão.
- **Trimestres:**
  - 1º Trimestre: Semanas 0 a 13 (0 a 97 dias).
  - 2º Trimestre: Semanas 14 a 27 (98 a 195 dias).
  - 3º Trimestre: Semanas 28 a 42+ (196+ dias).

### RN02: Provisionamento Doula-First
- Não há botão de "Cadastrar" na tela de login.
- A Doula cadastra a gestante via Anamnese chamando a Edge Function `create-pregnant-client` (usando `service_role` para não derrubar a sessão atual da Doula).
- A gestante é criada com `must_change_password: true`.

### RN03: Diário & Propagação de Peso
- Chave única: `UNIQUE(pregnancy_id, log_date)`. Salvar o diário no mesmo dia é um `UPSERT`.
- Os campos de peso (`mother_weight_kg`, `baby_estimated_weight_g`) são opcionais (`NULLABLE`). O gráfico deve interpolar apenas pontos não nulos.

### RN04: Red Flags Obstétricas
- Marcar `has_red_flag = true` se:
  1. Sintomas incluírem `'SANGRAMENTO'`, `'PERDA_LIQUIDO'` ou `'CEFALEIA_VISAO_TURVA'`.
  2. Movimentação fetal for `'DECREASED'` e a IG for `>= 28 semanas`.
- Destacar cliente no topo do Dashboard da Doula como **Atenção Prioritária**.

---

## 4. Estrutura de Diretórios

```text
minha-gestacao/
├── AGENT.md                       # Este arquivo de contexto
├── SPEC.md                        # Especificação canônica completa
├── docs/                          # Documentação detalhada do projeto
│   ├── README.md                  # Índice da documentação
│   ├── supabase-guide.md          # Setup do Supabase, migrations, seed, RLS
│   ├── local-development.md       # Execução local, Web, LAN, Docker
│   ├── android-build-guide.md     # Build e execução Android (EAS / local)
│   └── obstetric-engine.md        # Documentação técnica do cálculo obstétrico
├── src/
│   ├── app/                       # Rotas Expo Router v4
│   │   ├── _layout.tsx            # Providers globais (QueryClient, SafeArea)
│   │   ├── index.tsx              # Rota inicial / Switcher
│   │   ├── (auth)/                # login.tsx, change-password.tsx
│   │   ├── (pregnant)/            # Abas da gestante: home, diary, timeline, calendar, chat, profile
│   │   └── (doula)/               # Painel da doula: dashboard, new-anamnesis, inbox, client/[id]
│   ├── components/                # Componentes modulares (ui/, pregnant/, doula/, shared/)
│   ├── hooks/                     # Custom hooks React Query / Supabase
│   ├── lib/
│   │   ├── obstetrics.ts          # Funções puras RN01 e RN04
│   │   ├── supabase.ts            # Cliente Supabase
│   │   └── __tests__/             # Testes unitários do motor obstétrico
│   ├── stores/                    # Zustand stores (auth, doula, pregnant)
│   ├── types/                     # Tipagens TypeScript (database.ts)
│   └── global.css                 # Diretivas Tailwind
├── supabase/
│   ├── migrations/                # SQL Schema versionado + RLS policies
│   ├── seed.sql                   # Seed de metadados das semanas 1 a 42
│   └── functions/                 # Supabase Edge Functions (create-pregnant-client)
├── Dockerfile.dev
├── docker-compose.yml
├── tailwind.config.js
└── package.json
```

---

## 5. Roadmap SDD (Status das Features)

- [x] **FEATURE 00: Foundation, Docker, Database & Obstetrics Engine**
  - Setup Expo Router + NativeWind v4.
  - Migrations SQL completas com RLS + Seed das 42 semanas.
  - `src/lib/obstetrics.ts` testado (13/13 testes aprovados).
  - Layouts vazios responsivos implementados.
- [x] **FEATURE 01: Authentication, RBAC & First-Access Flow**
  - Cliente Supabase com storage universal (`safeStorage`) e `useAuthStore` (Zustand).
  - Tela `(auth)/login.tsx` com formulário acolhedor, aviso RN02 e botões de validação rápida.
  - Tela `(auth)/change-password.tsx` com validação de senha e persistência no perfil.
  - Route Guard (`src/lib/auth-guard.ts` e `src/app/_layout.tsx`) com proteção e bloqueio estrito de rotas cruzadas.
  - Componentes reutilizáveis em `src/components/ui/` (`Button`, `Input`, `Card`).
  - 40 testes unitários cobrindo cálculos obstétricos, store de autenticação e proteção RBAC.
- [x] **FEATURE 02: Doula Anamnesis Wizard & Client Provisioning**
  - Edge Function `create-pregnant-client` (`supabase/functions/create-pregnant-client/index.ts`) para provisionamento no Auth sem derrubar a sessão da Doula.
  - Tela `(doula)/new-anamnesis.tsx` com Stepper responsivo de 5 passos (Identificação, Cálculo IG/DPP com preview em tempo real, Histórico Obstétrico G/P/A com verificação de consistência e IMC, Plano de Parto & Notas Confidenciais, e Dados do Bebê com resumo final).
  - Componentes modulares: `Stepper`, `ObstetricPreviewCard`, `WhatsAppModal`, `SelectChips`, `NumberStepper`.
  - Disparo de convite acolhedor via WhatsApp com deep link formatado e senha temporária (`must_change_password: true`).
  - 64 testes unitários automatizados cobrindo esquemas Zod, cálculo obstétrico dinâmico, biometria e provisionamento.
  - 11 capturas de validação E2E via Playwright cobrindo todos os passos, erros de validação, alternância DUM/Ultrassom, modal do WhatsApp e responsividade.
- [ ] **FEATURE 03: Dashboards (Visão da Doula & Home da Gestante)**
- [ ] **FEATURE 04: Diário da Gestante & Motor de Alertas**
- [ ] **FEATURE 05: Timeline (Barra de Nível 40 Semanas) & Gráficos de Peso**
- [ ] **FEATURE 06: Calendário, Prescrições de Exercícios & Videochamada**
- [ ] **FEATURE 07: Bate-Papo Humanizado em Tempo Real (Texto, Áudio e Fotos)**

---

## 6. Comandos Essenciais

```bash
# Rodar testes unitários (Jest)
npm test

# Verificar tipagem TypeScript
npx tsc --noEmit

# Iniciar servidor Expo (Web)
npx expo start --web

# Iniciar servidor Expo para Mobile (LAN)
npx expo start --lan

# Testar export estático do Expo Router
npx expo export --platform web

# Validação E2E no navegador com Playwright (na branch da feature)
# Navegar para http://localhost:8081 e validar os fluxos da tela
```

---

## 7. Instruções para Modificações de Código

1. **Sempre rode `npm test` e `npx tsc --noEmit`** após qualquer alteração no código para garantir que nenhuma regressão foi introduzida.
2. **Nunca use cálculos de data locais** para idade gestacional — use sempre as funções UTC de `src/lib/obstetrics.ts`.
3. **Mantenha a responsividade:** telas da Doula devem ser otimizadas para larguras grandes (`md:` >= 768px para tablet/desktop) e telas da Gestante devem priorizar o uso com uma só mão em telas móveis.
4. **Preserve a humanização:** textos, mensagens de erro e dicas devem sempre manter um tom acolhedor, empático e cientificamente embasado.
5. **Testes E2E com Playwright & Ciclo de Vida dos Testes:**
   - **Na branch da feature:** Ao concluir a implementação, execute a validação no navegador via **Playwright** (`http://localhost:8081`) para validar os fluxos, formulários, RBAC e responsividade, gerando os prints para comprovação visual.
   - **Limpeza no merge para a `main`:** Os prints e artefatos gerados pelo Playwright são estritamente temporários. Assim que o merge da feature for realizado para a `main`, todos os prints/arquivos de teste gerados são excluídos para manter a branch `main` limpa.
   - **Próxima feature pronta para novos testes:** Ao iniciar a feature seguinte em uma nova branch, o ambiente estará limpo para realizar seus próprios testes e capturar novos prints assim que ela for concluída.
