import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface CreatePregnantClientPayload {
  // Mother info
  full_name: string;
  email: string;
  phone?: string | null;
  // Obstetric calculation
  calc_method: 'DUM' | 'ULTRASOUND';
  dum_date?: string | null;
  ultrasound_date?: string | null;
  ultrasound_weeks?: number | null;
  ultrasound_days?: number | null;
  // Health & Physical
  height_cm?: number | null;
  pre_pregnancy_weight_kg?: number | null;
  blood_type?: string | null;
  gravida_count?: number;
  vaginal_births_count?: number;
  cesarean_count?: number;
  abortions_count?: number;
  health_conditions?: string | null;
  medications_in_use?: string | null;
  // Support & Birth preferences
  partner_name?: string | null;
  partner_phone?: string | null;
  support_network_notes?: string | null;
  desired_birth_type?: string | null;
  target_maternity_hospital?: string | null;
  obstetrician_name?: string | null;
  doula_private_notes?: string | null;
  // Baby
  nickname?: string;
  official_name?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'SURPRISE' | 'UNKNOWN';
  estimated_weight_g?: number | null;
}

/**
 * Pure UTC date helpers matching RN01 standard
 */
function normalizeToUtc(input: string): Date {
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function formatIso(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeEffectiveDumAndDpp(payload: CreatePregnantClientPayload): { effectiveDum: string; dpp: string } {
  let effectiveDumDate: Date;

  if (payload.calc_method === 'ULTRASOUND' && payload.ultrasound_date && payload.ultrasound_weeks != null) {
    const usDate = normalizeToUtc(payload.ultrasound_date);
    const totalDaysPassed = Math.floor(payload.ultrasound_weeks * 7) + Math.floor(payload.ultrasound_days || 0);
    effectiveDumDate = new Date(usDate.getTime() - totalDaysPassed * 86400000);
  } else if (payload.dum_date) {
    effectiveDumDate = normalizeToUtc(payload.dum_date);
  } else {
    throw new Error('Data da DUM ou do Ultrassom é obrigatória para o cálculo obstétrico.');
  }

  const dppDate = new Date(effectiveDumDate.getTime() + 280 * 86400000);

  return {
    effectiveDum: formatIso(effectiveDumDate),
    dpp: formatIso(dppDate),
  };
}

/**
 * Generates an easy-to-type, welcoming temporary password
 */
function generateTemporaryPassword(): string {
  const words = ['Amor', 'Vida', 'Luz', 'Flor', 'Ninho', 'Afeto', 'Bebê'];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${randomWord}@${randomNum}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured on server.');
    }

    // Client using service role for admin operations without disrupting Doula session
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Verify caller authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Autorização ausente. Faça login como Doula.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: 'Sessão inválida ou expirada.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is a DOULA
    const { data: callerProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', callingUser.id)
      .single();

    if (profileCheckError || !callerProfile || callerProfile.role !== 'DOULA') {
      return new Response(JSON.stringify({ error: 'Apenas usuárias com perfil Doula podem cadastrar gestantes.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const doulaId = callingUser.id;
    const doulaName = callerProfile.full_name;

    // 2. Parse payload
    const payload: CreatePregnantClientPayload = await req.json();

    if (!payload.full_name || !payload.email) {
      return new Response(JSON.stringify({ error: 'Nome completo e e-mail da gestante são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Calculate effective_dum and dpp_date (RN01)
    const { effectiveDum, dpp } = computeEffectiveDumAndDpp(payload);

    // 4. Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // 5. Create pregnant user in auth.users with must_change_password: true
    const { data: createdAuthUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email.trim().toLowerCase(),
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        role: 'PREGNANT',
        full_name: payload.full_name.trim(),
        must_change_password: true,
      },
    });

    if (createUserError || !createdAuthUser.user) {
      return new Response(
        JSON.stringify({
          error: `Erro ao criar acesso da gestante: ${createUserError?.message || 'Falha desconhecida'}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = createdAuthUser.user.id;

    try {
      // 6. Insert profile
      const { error: insertProfileError } = await supabaseAdmin.from('profiles').insert({
        id: newUserId,
        role: 'PREGNANT',
        full_name: payload.full_name.trim(),
        phone: payload.phone?.trim() || null,
        must_change_password: true,
        doula_status: 'ONLINE',
      });

      if (insertProfileError) {
        throw new Error(`Erro ao criar perfil da gestante: ${insertProfileError.message}`);
      }

      // 7. Insert pregnancy record
      const { data: newPregnancy, error: insertPregnancyError } = await supabaseAdmin
        .from('pregnancies')
        .insert({
          pregnant_user_id: newUserId,
          doula_user_id: doulaId,
          status: 'ACTIVE',
          calc_method: payload.calc_method,
          dum_date: payload.dum_date || null,
          ultrasound_date: payload.ultrasound_date || null,
          ultrasound_weeks: payload.ultrasound_weeks ?? null,
          ultrasound_days: payload.ultrasound_days ?? null,
          effective_dum: effectiveDum,
          dpp_date: dpp,
          height_cm: payload.height_cm ?? null,
          pre_pregnancy_weight_kg: payload.pre_pregnancy_weight_kg ?? null,
          blood_type: payload.blood_type || null,
          gravida_count: payload.gravida_count ?? 1,
          vaginal_births_count: payload.vaginal_births_count ?? 0,
          cesarean_count: payload.cesarean_count ?? 0,
          abortions_count: payload.abortions_count ?? 0,
          partner_name: payload.partner_name?.trim() || null,
          partner_phone: payload.partner_phone?.trim() || null,
          support_network_notes: payload.support_network_notes?.trim() || null,
          health_conditions: payload.health_conditions?.trim() || null,
          medications_in_use: payload.medications_in_use?.trim() || null,
          desired_birth_type: payload.desired_birth_type?.trim() || null,
          target_maternity_hospital: payload.target_maternity_hospital?.trim() || null,
          obstetrician_name: payload.obstetrician_name?.trim() || null,
          doula_private_notes: payload.doula_private_notes?.trim() || null,
        })
        .select()
        .single();

      if (insertPregnancyError || !newPregnancy) {
        throw new Error(`Erro ao salvar ficha obstétrica: ${insertPregnancyError?.message}`);
      }

      // 8. Insert baby record
      const babyNickname = payload.nickname?.trim() || 'Bebê';
      const { data: newBaby, error: insertBabyError } = await supabaseAdmin
        .from('babies')
        .insert({
          pregnancy_id: newPregnancy.id,
          nickname: babyNickname,
          official_name: payload.official_name?.trim() || null,
          gender: payload.gender || 'UNKNOWN',
          birth_weight_g: payload.estimated_weight_g ?? null,
        })
        .select()
        .single();

      if (insertBabyError) {
        throw new Error(`Erro ao cadastrar bebê: ${insertBabyError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          credentials: {
            email: payload.email.trim().toLowerCase(),
            temporaryPassword,
            full_name: payload.full_name.trim(),
            phone: payload.phone?.trim() || null,
            baby_nickname: babyNickname,
            doula_name: doulaName,
          },
          pregnancy: newPregnancy,
          baby: newBaby,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (innerError: any) {
      // Rollback auth user creation if database inserts failed
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw innerError;
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Erro inesperado no servidor ao cadastrar gestante.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

