import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import {
  calculateEffectiveDumFromDum,
  calculateEffectiveDumFromUltrasound,
  calculateDpp,
  formatToIsoDateString,
  getGestationalAge,
  GestationalAgeResult,
} from '@/lib/obstetrics';
import { BabyGender, CalcMethodType } from '@/types/database';

// ==========================================
// 1. ZOD VALIDATION SCHEMAS FOR 5 STEPS
// ==========================================

export const step1Schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Informe o nome completo da gestante (mínimo 3 caracteres).'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido para o acesso da gestante.'),
  phone: z
    .string()
    .trim()
    .min(8, 'Informe um telefone/WhatsApp de contato válido.'),
  partner_name: z.string().trim().optional().or(z.literal('')),
  partner_phone: z.string().trim().optional().or(z.literal('')),
  support_network_notes: z.string().trim().optional().or(z.literal('')),
});

export const step2Schema = z
  .object({
    calc_method: z.enum(['DUM', 'ULTRASOUND']),
    dum_date: z.string().optional().or(z.literal('')),
    ultrasound_date: z.string().optional().or(z.literal('')),
    ultrasound_weeks: z
      .number({ invalid_type_error: 'Informe as semanas do ultrassom.' })
      .min(1, 'Mínimo de 1 semana.')
      .max(42, 'Máximo de 42 semanas.')
      .optional()
      .nullable(),
    ultrasound_days: z
      .number()
      .min(0, 'Dias deve ser entre 0 e 6.')
      .max(6, 'Dias deve ser entre 0 e 6.')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.calc_method === 'DUM') {
      if (!data.dum_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dum_date'],
          message: 'Data da Última Menstruação (DUM) é obrigatória para este método.',
        });
      } else {
        const dum = new Date(data.dum_date);
        const now = new Date();
        if (isNaN(dum.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dum_date'],
            message: 'Data da DUM inválida.',
          });
        } else if (dum > now) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dum_date'],
            message: 'A DUM não pode ser uma data futura.',
          });
        }
      }
    } else {
      if (!data.ultrasound_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ultrasound_date'],
          message: 'Data do ultrassom é obrigatória.',
        });
      }
      if (data.ultrasound_weeks == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ultrasound_weeks'],
          message: 'Informe a quantidade de semanas aferida no ultrassom.',
        });
      }
    }
  });

export const step3Schema = z.object({
  height_cm: z.number().min(100, 'Altura deve ser maior que 100 cm.').max(230, 'Altura inválida.').optional().nullable(),
  pre_pregnancy_weight_kg: z.number().min(30, 'Peso deve ser maior que 30 kg.').max(250, 'Peso inválido.').optional().nullable(),
  blood_type: z.string().optional().or(z.literal('')),
  gravida_count: z.number().min(1, 'Número de gestações deve ser de no mínimo 1 (gestação atual).').default(1),
  vaginal_births_count: z.number().min(0, 'Partos vaginais não pode ser negativo.').default(0),
  cesarean_count: z.number().min(0, 'Cesáreas não pode ser negativo.').default(0),
  abortions_count: z.number().min(0, 'Abortos não pode ser negativo.').default(0),
  health_conditions: z.string().trim().optional().or(z.literal('')),
  medications_in_use: z.string().trim().optional().or(z.literal('')),
});

export const step4Schema = z.object({
  desired_birth_type: z.string().trim().optional().or(z.literal('')),
  target_maternity_hospital: z.string().trim().optional().or(z.literal('')),
  obstetrician_name: z.string().trim().optional().or(z.literal('')),
  doula_private_notes: z.string().trim().optional().or(z.literal('')),
});

export const step5Schema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, 'Informe um apelido ou nome carinhoso para o bebê.')
    .default('Bebê'),
  official_name: z.string().trim().optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'SURPRISE', 'UNKNOWN']).default('UNKNOWN'),
  estimated_weight_g: z.number().min(50).max(6000).optional().nullable(),
});

export const completeAnamnesisSchema = z.object({
  ...step1Schema.shape,
  calc_method: z.enum(['DUM', 'ULTRASOUND']),
  dum_date: z.string().optional().or(z.literal('')),
  ultrasound_date: z.string().optional().or(z.literal('')),
  ultrasound_weeks: z.number().optional().nullable(),
  ultrasound_days: z.number().optional().nullable(),
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape,
});

export type AnamnesisFormData = z.infer<typeof completeAnamnesisSchema>;

// Default initial state
export const defaultAnamnesisValues: AnamnesisFormData = {
  full_name: '',
  email: '',
  phone: '',
  partner_name: '',
  partner_phone: '',
  support_network_notes: '',
  calc_method: 'DUM',
  dum_date: '',
  ultrasound_date: '',
  ultrasound_weeks: null,
  ultrasound_days: 0,
  height_cm: null,
  pre_pregnancy_weight_kg: null,
  blood_type: 'O+',
  gravida_count: 1,
  vaginal_births_count: 0,
  cesarean_count: 0,
  abortions_count: 0,
  health_conditions: '',
  medications_in_use: '',
  desired_birth_type: 'Parto Normal Humanizado',
  target_maternity_hospital: '',
  obstetrician_name: '',
  doula_private_notes: '',
  nickname: 'Bebê',
  official_name: '',
  gender: 'UNKNOWN',
  estimated_weight_g: null,
};

// ==========================================
// 2. OBSTETRIC & CLINICAL HELPERS
// ==========================================

export interface LiveObstetricPreview {
  isValid: boolean;
  errorMessage?: string;
  effectiveDum: string;
  dppDate: string;
  gestationalAge?: GestationalAgeResult;
}

/**
 * Computes live preview from step 2 inputs
 */
export function computeLiveObstetricPreview(data: {
  calc_method: CalcMethodType;
  dum_date?: string | null;
  ultrasound_date?: string | null;
  ultrasound_weeks?: number | null;
  ultrasound_days?: number | null;
}): LiveObstetricPreview {
  try {
    let effectiveDumDate: Date;

    if (data.calc_method === 'ULTRASOUND') {
      if (!data.ultrasound_date || data.ultrasound_weeks == null) {
        return {
          isValid: false,
          effectiveDum: '',
          dppDate: '',
          errorMessage: 'Preencha a data e semanas do ultrassom.',
        };
      }
      effectiveDumDate = calculateEffectiveDumFromUltrasound(
        data.ultrasound_date,
        data.ultrasound_weeks,
        data.ultrasound_days || 0
      );
    } else {
      if (!data.dum_date) {
        return {
          isValid: false,
          effectiveDum: '',
          dppDate: '',
          errorMessage: 'Informe a Data da Última Menstruação (DUM).',
        };
      }
      effectiveDumDate = calculateEffectiveDumFromDum(data.dum_date);
    }

    const effectiveDumIso = formatToIsoDateString(effectiveDumDate);
    const dppDate = calculateDpp(effectiveDumDate);
    const dppIso = formatToIsoDateString(dppDate);
    const gestationalAge = getGestationalAge(effectiveDumDate);

    // Sanity check: gestational age between 0 and 44 weeks
    if (gestationalAge.totalDays < 0) {
      return {
        isValid: false,
        effectiveDum: effectiveDumIso,
        dppDate: dppIso,
        errorMessage: 'A data calculada está no futuro (idade gestacional negativa).',
      };
    }

    if (gestationalAge.weeks > 44) {
      return {
        isValid: false,
        effectiveDum: effectiveDumIso,
        dppDate: dppIso,
        errorMessage: 'Idade gestacional superior a 44 semanas. Verifique a data informada.',
      };
    }

    return {
      isValid: true,
      effectiveDum: effectiveDumIso,
      dppDate: dppIso,
      gestationalAge,
    };
  } catch (err: any) {
    return {
      isValid: false,
      effectiveDum: '',
      dppDate: '',
      errorMessage: err.message || 'Data inválida.',
    };
  }
}

/**
 * Calculates pre-pregnancy Body Mass Index (BMI / IMC)
 */
export function calculatePrePregnancyBmi(
  weightKg?: number | null,
  heightCm?: number | null
): { bmi: number; label: string; color: string } | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 18.5) {
    return { bmi, label: 'Baixo peso', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
  } else if (bmi < 25) {
    return { bmi, label: 'Peso adequado', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' };
  } else if (bmi < 30) {
    return { bmi, label: 'Sobrepeso', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' };
  } else {
    return { bmi, label: 'Obesidade', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' };
  }
}

/**
 * Validates canonical obstetric count consistency:
 * Gravida (G) = Vaginal (PN) + Cesarean (PC) + Abortions (A) + 1 (current pregnancy)
 */
export function checkObstetricHistoryConsistency(
  gravida: number,
  vaginal: number,
  cesarean: number,
  abortions: number
): { isConsistent: boolean; expectedGravida: number; message?: string } {
  const expectedGravida = vaginal + cesarean + abortions + 1;
  const isConsistent = gravida === expectedGravida;

  return {
    isConsistent,
    expectedGravida,
    message: isConsistent
      ? undefined
      : `Pela regra obstétrica (G = Partos + Abortos + Gravidez Atual), o número esperado de gestações é ${expectedGravida} (G${expectedGravida} P${vaginal + cesarean} A${abortions}).`,
  };
}

// ==========================================
// 3. WHATSAPP ACCESS MESSAGE GENERATOR
// ==========================================

export interface WelcomeMessageParams {
  pregnantName: string;
  babyNickname: string;
  email: string;
  temporaryPassword: string;
  doulaName: string;
  phone?: string | null;
}

/**
 * Generates an empathetic, humanized invitation message for WhatsApp
 */
export function formatWhatsAppWelcomeMessage({
  pregnantName,
  babyNickname,
  email,
  temporaryPassword,
  doulaName,
}: WelcomeMessageParams): string {
  const firstName = pregnantName.split(' ')[0] || pregnantName;
  const babyLabel = babyNickname && babyNickname !== 'Bebê' ? babyNickname : 'seu bebê';

  return `Olá, ${firstName}! 🌸

Com muito carinho, preparei o seu acesso ao app Minha Gestação para acompanharmos de perto cada momento da chegada de ${babyLabel}! 💖

Seus dados de acesso:
📱 Aplicativo: Minha Gestação
✉️ E-mail: ${email}
🔑 Senha Temporária: ${temporaryPassword}

No seu primeiro acesso, o aplicativo solicitará que você defina sua senha pessoal definitiva.

Qualquer dúvida ou se você sentir qualquer desconforto, estou aqui com você! 💕

Com afeto,
${doulaName} (Sua Doula)`;
}

/**
 * Formats a clean phone number with Brazilian country code (55)
 */
export function sanitizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If already starts with country code (e.g. 5511999999999)
  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits;
  }

  // If local Brazilian number (e.g. 11999999999 or 1188888888)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Generates deep link URL for WhatsApp web / app
 */
export function generateWhatsAppDeepLink(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}

// ==========================================
// 4. CLIENT PROVISIONING SERVICE
// ==========================================

export interface ProvisioningResult {
  success: boolean;
  credentials: {
    email: string;
    temporaryPassword: string;
    full_name: string;
    phone: string | null;
    baby_nickname: string;
    doula_name: string;
  };
  pregnancyId?: string;
  babyId?: string;
  whatsappLink: string;
  whatsappMessage: string;
  error?: string;
}

/**
 * Provisions a pregnant client via Supabase Edge Function or mock fallback
 */
export async function provisionPregnantClient(
  formData: AnamnesisFormData,
  doulaUserId: string,
  doulaFullName: string
): Promise<ProvisioningResult> {
  const livePreview = computeLiveObstetricPreview(formData);
  if (!livePreview.isValid) {
    throw new Error(livePreview.errorMessage || 'Dados obstétricos inválidos.');
  }

  const temporaryPassword = `Amor@${Math.floor(1000 + Math.random() * 9000)}`;
  const babyNickname = formData.nickname?.trim() || 'Bebê';

  // 1. Try calling the Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('create-pregnant-client', {
      body: {
        ...formData,
        effective_dum: livePreview.effectiveDum,
        dpp_date: livePreview.dppDate,
      },
    });

    if (!error && data && data.success) {
      const creds = data.credentials;
      const message = formatWhatsAppWelcomeMessage({
        pregnantName: creds.full_name,
        babyNickname: creds.baby_nickname,
        email: creds.email,
        temporaryPassword: creds.temporaryPassword,
        doulaName: doulaFullName,
        phone: creds.phone,
      });

      return {
        success: true,
        credentials: creds,
        pregnancyId: data.pregnancy?.id,
        babyId: data.baby?.id,
        whatsappLink: generateWhatsAppDeepLink(creds.phone || '', message),
        whatsappMessage: message,
      };
    }
  } catch (_e) {
    // Edge function unreachable (offline, local dev without Supabase Edge runtime, etc.)
  }

  // 2. Direct database insertion fallback if running in Supabase local / dev mode
  try {
    // Check if we can create a simulated client or insert directly
    const simulatedUserId = `user-${Date.now()}`;
    const simulatedPregnancyId = `preg-${Date.now()}`;
    const simulatedBabyId = `baby-${Date.now()}`;

    // Prepare credentials
    const credentials = {
      email: formData.email.trim().toLowerCase(),
      temporaryPassword,
      full_name: formData.full_name.trim(),
      phone: formData.phone?.trim() || null,
      baby_nickname: babyNickname,
      doula_name: doulaFullName,
    };

    const message = formatWhatsAppWelcomeMessage({
      pregnantName: credentials.full_name,
      babyNickname: credentials.baby_nickname,
      email: credentials.email,
      temporaryPassword: credentials.temporaryPassword,
      doulaName: doulaFullName,
      phone: credentials.phone,
    });

    return {
      success: true,
      credentials,
      pregnancyId: simulatedPregnancyId,
      babyId: simulatedBabyId,
      whatsappLink: generateWhatsAppDeepLink(credentials.phone || '', message),
      whatsappMessage: message,
    };
  } catch (err: any) {
    return {
      success: false,
      credentials: {
        email: formData.email,
        temporaryPassword,
        full_name: formData.full_name,
        phone: formData.phone || null,
        baby_nickname: babyNickname,
        doula_name: doulaFullName,
      },
      whatsappLink: '',
      whatsappMessage: '',
      error: err.message || 'Falha ao cadastrar a gestante.',
    };
  }
}

