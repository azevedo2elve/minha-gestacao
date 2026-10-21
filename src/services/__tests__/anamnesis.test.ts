// Mock Supabase to avoid react-native runtime import in Node/Jest
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(async () => ({ data: null, error: new Error('Fallback to mock') })),
    },
  },
}));

import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  computeLiveObstetricPreview,
  calculatePrePregnancyBmi,
  checkObstetricHistoryConsistency,
  sanitizePhoneNumber,
  formatWhatsAppWelcomeMessage,
  generateWhatsAppDeepLink,
  provisionPregnantClient,
  defaultAnamnesisValues,
} from '../anamnesis';

describe('Feature 02: Anamnesis Service & Validation', () => {
  // ========================================================
  // 1. ZOD SCHEMAS VALIDATION
  // ========================================================

  describe('Step 1 Schema (Identificação & Apoio)', () => {
    it('should validate valid mother identification data', () => {
      const validData = {
        full_name: 'Camila Santos de Almeida',
        email: 'camila.santos@exemplo.com',
        phone: '(11) 98765-4321',
        partner_name: 'Lucas Ferreira',
        partner_phone: '(11) 91234-5678',
        support_network_notes: 'Mãe e sogra presentes',
      };

      const result = step1Schema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when full_name is shorter than 3 characters', () => {
      const invalidData = {
        full_name: 'Ca',
        email: 'camila@exemplo.com',
        phone: '11999999999',
      };

      const result = step1Schema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('full_name');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        full_name: 'Camila Santos',
        email: 'camila-sem-arroba.com',
        phone: '11999999999',
      };

      const result = step1Schema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
      }
    });

    it('should reject phone numbers that are too short', () => {
      const invalidData = {
        full_name: 'Camila Santos',
        email: 'camila@exemplo.com',
        phone: '123',
      };

      const result = step1Schema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('phone');
      }
    });
  });

  describe('Step 2 Schema (Cálculo Obstétrico)', () => {
    it('should accept valid DUM date', () => {
      const validDum = {
        calc_method: 'DUM' as const,
        dum_date: '2026-01-10',
      };

      const result = step2Schema.safeParse(validDum);
      expect(result.success).toBe(true);
    });

    it('should reject empty DUM date when method is DUM', () => {
      const invalidDum = {
        calc_method: 'DUM' as const,
        dum_date: '',
      };

      const result = step2Schema.safeParse(invalidDum);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('dum_date');
      }
    });

    it('should reject future DUM date', () => {
      const futureDum = {
        calc_method: 'DUM' as const,
        dum_date: '2099-01-01',
      };

      const result = step2Schema.safeParse(futureDum);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('dum_date');
      }
    });

    it('should accept valid Ultrasound input', () => {
      const validUs = {
        calc_method: 'ULTRASOUND' as const,
        ultrasound_date: '2026-03-01',
        ultrasound_weeks: 10,
        ultrasound_days: 2,
      };

      const result = step2Schema.safeParse(validUs);
      expect(result.success).toBe(true);
    });

    it('should reject Ultrasound with missing weeks or date', () => {
      const invalidUs = {
        calc_method: 'ULTRASOUND' as const,
        ultrasound_date: '',
        ultrasound_weeks: null,
      };

      const result = step2Schema.safeParse(invalidUs);
      expect(result.success).toBe(false);
    });
  });

  describe('Step 3 Schema (Histórico & Saúde)', () => {
    it('should validate valid obstetric counts', () => {
      const valid = {
        gravida_count: 2,
        vaginal_births_count: 1,
        cesarean_count: 0,
        abortions_count: 0,
        height_cm: 165,
        pre_pregnancy_weight_kg: 60,
      };

      const result = step3Schema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject gravida_count < 1', () => {
      const invalid = {
        gravida_count: 0,
      };

      const result = step3Schema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('gravida_count');
      }
    });
  });

  describe('Step 5 Schema (Dados do Bebê)', () => {
    it('should require a non-empty nickname', () => {
      const valid = {
        nickname: 'Maya',
        gender: 'FEMALE' as const,
      };
      expect(step5Schema.safeParse(valid).success).toBe(true);

      const invalid = {
        nickname: '',
        gender: 'UNKNOWN' as const,
      };
      expect(step5Schema.safeParse(invalid).success).toBe(false);
    });
  });

  // ========================================================
  // 2. OBSTETRIC CALCULATION & PREVIEW
  // ========================================================

  describe('Live Obstetric Preview (computeLiveObstetricPreview)', () => {
    it('should compute valid gestational age and DPP from DUM', () => {
      // Assuming today is around Oct 2026, let's use a known DUM
      const dumDate = '2026-01-15';
      const preview = computeLiveObstetricPreview({
        calc_method: 'DUM',
        dum_date: dumDate,
      });

      expect(preview.isValid).toBe(true);
      expect(preview.effectiveDum).toBe('2026-01-15');
      expect(preview.dppDate).toBe('2026-10-22'); // 2026-01-15 + 280 days
      expect(preview.gestationalAge).toBeDefined();
      expect(preview.gestationalAge?.trimester).toBeDefined();
      expect(preview.gestationalAge?.progressPercentage).toBeGreaterThan(0);
    });

    it('should compute valid gestational age and DPP from Ultrasound', () => {
      // Ultrasound on 2026-03-01 with 8 weeks 0 days
      // Effective DUM = 2026-03-01 - 56 days = 2026-01-04
      // DPP = 2026-01-04 + 280 days = 2026-10-11
      const preview = computeLiveObstetricPreview({
        calc_method: 'ULTRASOUND',
        ultrasound_date: '2026-03-01',
        ultrasound_weeks: 8,
        ultrasound_days: 0,
      });

      expect(preview.isValid).toBe(true);
      expect(preview.effectiveDum).toBe('2026-01-04');
      expect(preview.dppDate).toBe('2026-10-11');
      expect(preview.gestationalAge).toBeDefined();
    });

    it('should return error when DUM is missing', () => {
      const preview = computeLiveObstetricPreview({
        calc_method: 'DUM',
        dum_date: '',
      });

      expect(preview.isValid).toBe(false);
      expect(preview.errorMessage).toContain('DUM');
    });

    it('should return error when Ultrasound weeks is missing', () => {
      const preview = computeLiveObstetricPreview({
        calc_method: 'ULTRASOUND',
        ultrasound_date: '2026-03-01',
        ultrasound_weeks: null,
      });

      expect(preview.isValid).toBe(false);
      expect(preview.errorMessage).toBeDefined();
    });
  });

  // ========================================================
  // 3. BMI & OBSTETRIC HISTORY CONSISTENCY
  // ========================================================

  describe('Biometry & Consistency Helpers', () => {
    it('should compute pre-pregnancy BMI correctly', () => {
      // Height 160 cm, Weight 55 kg -> 55 / (1.6 * 1.6) = 21.48 -> 21.5 (Peso adequado)
      const normal = calculatePrePregnancyBmi(55, 160);
      expect(normal).not.toBeNull();
      expect(normal?.bmi).toBe(21.5);
      expect(normal?.label).toBe('Peso adequado');

      // Low weight (< 18.5): 40 kg, 160 cm -> 15.6
      const low = calculatePrePregnancyBmi(40, 160);
      expect(low?.label).toBe('Baixo peso');

      // Overweight: 70 kg, 160 cm -> 27.3
      const over = calculatePrePregnancyBmi(70, 160);
      expect(over?.label).toBe('Sobrepeso');

      // Obesity: 85 kg, 160 cm -> 33.2
      const obese = calculatePrePregnancyBmi(85, 160);
      expect(obese?.label).toBe('Obesidade');
    });

    it('should return null for invalid BMI inputs', () => {
      expect(calculatePrePregnancyBmi(null, 160)).toBeNull();
      expect(calculatePrePregnancyBmi(60, null)).toBeNull();
      expect(calculatePrePregnancyBmi(0, 160)).toBeNull();
    });

    it('should check obstetric history consistency (G = PN + PC + A + 1)', () => {
      // Primigesta: G1, PN0, PC0, A0 -> 0 + 0 + 0 + 1 = 1 (Consistent)
      const primigesta = checkObstetricHistoryConsistency(1, 0, 0, 0);
      expect(primigesta.isConsistent).toBe(true);
      expect(primigesta.message).toBeUndefined();

      // Secundigesta with 1 normal birth: G2, PN1, PC0, A0 -> 1 + 0 + 0 + 1 = 2 (Consistent)
      const secundigesta = checkObstetricHistoryConsistency(2, 1, 0, 0);
      expect(secundigesta.isConsistent).toBe(true);

      // Inconsistent: User typed G1 but has PN1 -> expected G = 1 + 1 = 2
      const inconsistent = checkObstetricHistoryConsistency(1, 1, 0, 0);
      expect(inconsistent.isConsistent).toBe(false);
      expect(inconsistent.expectedGravida).toBe(2);
      expect(inconsistent.message).toContain('G2');
    });
  });

  // ========================================================
  // 4. WHATSAPP MESSAGE & PHONE SANITIZATION
  // ========================================================

  describe('WhatsApp Integration Helpers', () => {
    it('should sanitize Brazilian phone numbers properly', () => {
      // Number without country code
      expect(sanitizePhoneNumber('(11) 98765-4321')).toBe('5511987654321');
      expect(sanitizePhoneNumber('11987654321')).toBe('5511987654321');
      // Number already with country code 55
      expect(sanitizePhoneNumber('+55 (11) 98765-4321')).toBe('5511987654321');
      expect(sanitizePhoneNumber('5511987654321')).toBe('5511987654321');
      // Empty
      expect(sanitizePhoneNumber('')).toBe('');
    });

    it('should generate humanized WhatsApp welcome message', () => {
      const message = formatWhatsAppWelcomeMessage({
        pregnantName: 'Camila Santos',
        babyNickname: 'Maya',
        email: 'camila@exemplo.com',
        temporaryPassword: 'Amor@1234',
        doulaName: 'Helena Ramos',
      });

      expect(message).toContain('Olá, Camila! 🌸');
      expect(message).toContain('chegada de Maya! 💖');
      expect(message).toContain('camila@exemplo.com');
      expect(message).toContain('Amor@1234');
      expect(message).toContain('Helena Ramos (Sua Doula)');
      expect(message).toContain('defina sua senha pessoal definitiva');
    });

    it('should generate valid WhatsApp deep link URL', () => {
      const message = 'Olá, Camila!';
      const link = generateWhatsAppDeepLink('(11) 98765-4321', message);

      expect(link).toContain('https://wa.me/5511987654321');
      expect(link).toContain('text=Ol%C3%A1%2C%20Camila!');
    });
  });

  // ========================================================
  // 5. CLIENT PROVISIONING
  // ========================================================

  describe('Client Provisioning Service (provisionPregnantClient)', () => {
    it('should successfully provision a client with valid form data', async () => {
      const formData = {
        ...defaultAnamnesisValues,
        full_name: 'Mariana Lima',
        email: 'mariana.lima@exemplo.com',
        phone: '(11) 99999-8888',
        calc_method: 'DUM' as const,
        dum_date: '2026-01-20',
        nickname: 'Theo',
        gender: 'MALE' as const,
      };

      const result = await provisionPregnantClient(formData, 'doula-uuid-1', 'Helena Ramos');

      expect(result.success).toBe(true);
      expect(result.credentials.full_name).toBe('Mariana Lima');
      expect(result.credentials.email).toBe('mariana.lima@exemplo.com');
      expect(result.credentials.baby_nickname).toBe('Theo');
      expect(result.credentials.temporaryPassword).toMatch(/^Amor@\d{4}$/);
      expect(result.whatsappLink).toContain('https://wa.me/5511999998888');
      expect(result.whatsappMessage).toContain('Theo');
    });

    it('should throw an error when obstetric data is invalid during provisioning', async () => {
      const invalidFormData = {
        ...defaultAnamnesisValues,
        full_name: 'Mariana Lima',
        email: 'mariana.lima@exemplo.com',
        calc_method: 'DUM' as const,
        dum_date: '', // missing DUM!
      };

      await expect(
        provisionPregnantClient(invalidFormData, 'doula-uuid-1', 'Helena Ramos')
      ).rejects.toThrow();
    });
  });
});
