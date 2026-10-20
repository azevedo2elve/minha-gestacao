# 🩺 Motor de Cálculo Obstétrico: Minha Gestação

Este documento explica em detalhes a fundamentação clínica, fórmulas matemáticas e salvaguardas técnicas implementadas em [`src/lib/obstetrics.ts`](file:///home/azevedo/code/minha-gestacao/src/lib/obstetrics.ts).

---

## 1. Fundamentação Clínica e Parâmetros

Na obstetrícia moderna e humanizada, a datação da gestação determina marcos de desenvolvimento, datas de exames morfológicos e o planejamento do parto.

- **Duração Média da Gestação:** `280 dias` corridos (40 semanas completas a partir da DUM).
- **DPP (Data Provável do Parto):** Momento em que a gestante completa 40 semanas exatas.

> **Importante:** Apenas cerca de 5% dos bebês nascem exatamente na DPP. O nascimento entre **37 e 42 semanas** é considerado fisiologicamente a termo.

---

## 2. Métodos de Cálculo de Entrada (RN01)

No momento da Anamnese guiada, a Doula define qual o método mais confiável para a gestante:

### Método 1: Por DUM (`CALC_METHOD = 'DUM'`)
Indicado quando a gestante tem ciclo menstrual regular e recorda com precisão o primeiro dia do último ciclo menstrual.

$$\text{effective\_dum} = \text{dum\_date}$$
$$\text{dpp\_date} = \text{effective\_dum} + 280\text{ dias}$$

### Método 2: Pelo 1º Ultrassom (`CALC_METHOD = 'ULTRASOUND'`)
Indicado quando a DUM é incerta, irregular ou quando o ultrassom precoce (realizado preferencialmente no 1º trimestre entre 8 e 12 semanas) diverge significativamente da DUM.

A doula informa:
- Data em que o ultrassom foi realizado (`ultrasound_date`).
- Semanas e dias apontados no laudo do ultrassom (`us_weeks`, `us_days`).

O motor obstétrico retrocede no tempo para encontrar a **DUM Corrigida (`effective_dum`)**:

$$\text{dias\_decorridos} = (\text{us\_weeks} \times 7) + \text{us\_days}$$
$$\text{effective\_dum} = \text{ultrasound\_date} - \text{dias\_decorridos}$$
$$\text{dpp\_date} = \text{effective\_dum} + 280\text{ dias}$$

> **Vantagem Arquitetural:** Ao unificar qualquer método de entrada em uma data base canônica (`effective_dum`), todo o restante do sistema (home, evolução, gráficos, notificações e consultas) calcula semanas e trimestres de maneira uniforme e limpa.

---

## 3. Cálculo Dinâmico da Idade Gestacional Diária

A função `getGestationalAge(effective_dum, targetDate = today)` calcula o estado exato em qualquer dia:

$$\text{totalDays} = \text{diffInDays}(\text{targetDate}, \text{effective\_dum})$$
$$\text{weeks} = \left\lfloor \frac{\text{totalDays}}{7} \right\rfloor$$
$$\text{days} = \text{totalDays} \pmod 7$$
$$\text{daysRemaining} = \text{diffInDays}(\text{dpp\_date}, \text{targetDate})$$
$$\text{progressPercentage} = \min\left(100, \max\left(0, \text{round}\left(\frac{\text{totalDays}}{280} \times 100\right)\right)\right)$$

### Divisão de Trimestres
| Trimestre | Intervalo em Semanas | Intervalo em Dias | Descrição |
|---|---|---|---|
| **1º Trimestre** | 0 a 13 semanas | 0 a 97 dias | Organogênese, nidação e formação dos principais órgãos |
| **2º Trimestre** | 14 a 27 semanas | 98 a 195 dias | Crescimento, primeiros movimentos sentidos e estabilidade física |
| **3º Trimestre** | 28 a 42+ semanas | 196+ dias | Ganho de peso rápido, maturação pulmonar e preparação para o parto |

### Classificação de Termo
- **Prematuro / Pré-termo:** `< 37 semanas`
- **A Termo (Full Term):** `37 a 41 semanas e 6 dias`
- **Pós-termo:** `≥ 42 semanas`

---

## 4. Cuidados Técnicos: Aritmética de Datas em UTC

O objeto nativo `Date` do JavaScript é sensível ao fuso horário local e histórico de Horário de Verão (DST). 
Por exemplo, uma data como `"2026-05-10"` convertida ingenuamente em horário de Brasília (UTC-3) pode retroceder para `2026-05-09 21:00:00`, gerando um erro de 1 dia a menos na idade gestacional.

### A Solução Adotada em `src/lib/obstetrics.ts`
Todas as funções utilizam normalização para **UTC puro à meia-noite**:

```typescript
export function normalizeToUtcDate(input: string | Date): Date {
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }
  // ...
}
```

Isso garante que a diferença entre dias seja sempre um número inteiro exato, imune a transições de horário de verão e fusos horários.

---

## 5. Motor de Red Flags Obstétricas (RN04)

O sistema conta com um algoritmo preditivo para triagem no preenchimento do diário da gestante (`hasObstetricRedFlag`):

```typescript
export function hasObstetricRedFlag(params: {
  symptomTags?: string[] | null;
  fetalMovement?: string | null;
  gestationalWeeks?: number | null;
}): boolean
```

### Critérios de Alerta Crítico
1. **Sintomas com Risco Clínico Imediato:**
   - `'SANGRAMENTO'` (risco de descolamento de placenta ou ameaça de trabalho de parto prematuro).
   - `'PERDA_LIQUIDO'` (risco de ruptura prematura de membranas - amniorrexe).
   - `'CEFALEIA_VISAO_TURVA'` (sinal de alerta para pico hipertensivo / pré-eclâmpsia).
2. **Movimentação Fetal:**
   - Movimentação `'DECREASED'` **quando a gestação for ≥ 28 semanas** (a partir do 3º trimestre, a contagem de movimentos e padrão de vigília fetal é um marcador fundamental de vitalidade).

Quando uma Red Flag é identificada:
1. O registro do diário salva `has_red_flag = true`.
2. Um aviso empático e acolhedor é exibido para a gestante orientando o contato imediato com a doula ou pronto-atendimento.
3. No painel da doula (`/(doula)/dashboard`), o card da gestante é alçado para o bloco superior de **"Atenção Prioritária"**.

---

## 6. Cobertura de Testes Unitários

A suíte em [`src/lib/__tests__/obstetrics.test.ts`](file:///home/azevedo/code/minha-gestacao/src/lib/__tests__/obstetrics.test.ts) valida:
- Normalização e segurança em anos bissextos (ex: 29 de fevereiro).
- Equivalência matemática estrita entre método DUM e método Ultrassom.
- Limiares exatos de trimestres (dia 97 vs dia 98, dia 195 vs dia 196).
- Comportamento de borda na data de concepção (dia 0) e pós-termo (semana 42+).
- Ativação das Red Flags nos cenários de 27 semanas vs 28 semanas.
