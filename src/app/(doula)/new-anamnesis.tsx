import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  UserPlus,
  Lock,
  Sparkles,
  Baby,
  Calendar,
  Activity,
  Heart,
  Send,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { SelectChips } from '@/components/ui/SelectChips';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { Stepper, ANAMNESIS_STEPS } from '@/components/doula/Stepper';
import { ObstetricPreviewCard } from '@/components/doula/ObstetricPreviewCard';
import { WhatsAppModal } from '@/components/doula/WhatsAppModal';
import {
  AnamnesisFormData,
  defaultAnamnesisValues,
  computeLiveObstetricPreview,
  calculatePrePregnancyBmi,
  checkObstetricHistoryConsistency,
  provisionPregnantClient,
  ProvisioningResult,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
} from '@/services/anamnesis';

export default function NewAnamnesisScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const doulaId = user?.id || '11111111-1111-1111-1111-111111111111';
  const doulaName = profile?.full_name || 'Helena Ramos';

  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [formData, setFormData] = useState<AnamnesisFormData>(defaultAnamnesisValues);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Field updater
  const updateField = <K extends keyof AnamnesisFormData>(key: K, value: AnamnesisFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (stepErrors[key as string]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  // Live obstetric calculation preview
  const livePreview = useMemo(() => {
    return computeLiveObstetricPreview({
      calc_method: formData.calc_method,
      dum_date: formData.dum_date,
      ultrasound_date: formData.ultrasound_date,
      ultrasound_weeks: formData.ultrasound_weeks,
      ultrasound_days: formData.ultrasound_days,
    });
  }, [
    formData.calc_method,
    formData.dum_date,
    formData.ultrasound_date,
    formData.ultrasound_weeks,
    formData.ultrasound_days,
  ]);

  // Pre-pregnancy BMI calculation
  const bmiInfo = useMemo(() => {
    return calculatePrePregnancyBmi(formData.pre_pregnancy_weight_kg, formData.height_cm);
  }, [formData.pre_pregnancy_weight_kg, formData.height_cm]);

  // Canonical obstetric check G = PN + PC + A + 1
  const obstetricCheck = useMemo(() => {
    return checkObstetricHistoryConsistency(
      formData.gravida_count,
      formData.vaginal_births_count,
      formData.cesarean_count,
      formData.abortions_count
    );
  }, [
    formData.gravida_count,
    formData.vaginal_births_count,
    formData.cesarean_count,
    formData.abortions_count,
  ]);

  // Validate current step
  const validateStep = (stepNumber: number): boolean => {
    setStepErrors({});

    try {
      if (stepNumber === 1) {
        step1Schema.parse(formData);
      } else if (stepNumber === 2) {
        step2Schema.parse(formData);
        if (!livePreview.isValid) {
          setStepErrors({
            calc: livePreview.errorMessage || 'Dados obstétricos inválidos.',
          });
          return false;
        }
      } else if (stepNumber === 3) {
        step3Schema.parse(formData);
      } else if (stepNumber === 4) {
        step4Schema.parse(formData);
      } else if (stepNumber === 5) {
        step5Schema.parse(formData);
      }
      return true;
    } catch (err: any) {
      if (err.errors) {
        const errorsMap: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          const field = e.path[0];
          errorsMap[field] = e.message;
        });
        setStepErrors(errorsMap);
      }
      return false;
    }
  };

  // Next step handler
  const handleNext = () => {
    const isValid = validateStep(currentStep);
    if (!isValid) return;

    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setMaxReachedStep((prev) => Math.max(prev, nextStep));
    }
  };

  // Previous step handler
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/(doula)/dashboard');
    }
  };

  // Final submit handler
  const handleSubmit = async () => {
    const isStep5Valid = validateStep(5);
    if (!isStep5Valid) return;

    setIsSubmitting(true);
    try {
      const result = await provisionPregnantClient(formData, doulaId, doulaName);
      if (result.success) {
        setProvisioningResult(result);
        setShowSuccessModal(true);
      } else {
        Alert.alert('Erro ao cadastrar', result.error || 'Não foi possível cadastrar a gestante.');
      }
    } catch (err: any) {
      Alert.alert('Erro no cadastro', err.message || 'Falha na conexão com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Pressable
          onPress={handlePrevious}
          className="flex-row items-center gap-1.5 py-1 px-2 rounded-xl active:bg-cream-200"
        >
          <ArrowLeft size={18} color="#6B8E78" />
          <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">
            {currentStep === 1 ? 'Voltar ao Painel' : 'Passo Anterior'}
          </Text>
        </Pressable>

        <View className="bg-sage/10 dark:bg-dark-card px-3 py-1 rounded-full border border-sage/20">
          <Text className="text-[11px] font-bold text-sage-800 dark:text-sage-300">
            Passo {currentStep} de 5
          </Text>
        </View>
      </View>

      {/* Screen Title */}
      <View className="mb-6">
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-12 h-12 rounded-2xl bg-sage/20 items-center justify-center">
            <UserPlus size={24} color="#6B8E78" />
          </View>
          <View>
            <Text className="text-2xl font-bold text-gray-800 dark:text-cream">
              Nova Anamnese Perinatal
            </Text>
            <Text className="text-xs text-sage-700 dark:text-sage-300">
              Provisionamento humanizado da gestante com acesso direto e seguro
            </Text>
          </View>
        </View>
      </View>

      {/* 5-Step Stepper Component */}
      <Stepper
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepPress={(step) => {
          if (step < currentStep || validateStep(currentStep)) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Step Content Card */}
      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
        {/* ======================================================== */}
        {/* PASSO 1: IDENTIFICAÇÃO & REDE DE APOIO                   */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <View>
            <View className="mb-6 pb-4 border-b border-cream-300 dark:border-dark-border">
              <Text className="text-lg font-bold text-gray-800 dark:text-cream">
                1. Identificação & Contato da Gestante
              </Text>
              <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
                Dados para criar o acesso ao aplicativo e comunicação direta com a Doula.
              </Text>
            </View>

            <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input
                label="Nome Completo da Gestante *"
                placeholder="Ex: Camila Santos de Almeida"
                value={formData.full_name}
                onChangeText={(val) => updateField('full_name', val)}
                error={stepErrors.full_name}
              />

              <Input
                label="E-mail de Acesso (Login) *"
                placeholder="Ex: camila.santos@email.com"
                value={formData.email}
                onChangeText={(val) => updateField('email', val)}
                autoCapitalize="none"
                keyboardType="email-address"
                error={stepErrors.email}
                hint="A gestante usará este e-mail para entrar no app."
              />
            </View>

            <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input
                label="Telefone / WhatsApp *"
                placeholder="Ex: (11) 98765-4321"
                value={formData.phone}
                onChangeText={(val) => updateField('phone', val)}
                keyboardType="phone-pad"
                error={stepErrors.phone}
                hint="Usado para envio do convite pelo WhatsApp ao finalizar."
              />

              <Input
                label="Nome do(a) Parceiro(a) / Acompanhante"
                placeholder="Ex: Lucas Ferreira"
                value={formData.partner_name || ''}
                onChangeText={(val) => updateField('partner_name', val)}
              />
            </View>

            <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input
                label="Telefone do(a) Parceiro(a)"
                placeholder="Ex: (11) 91234-5678"
                value={formData.partner_phone || ''}
                onChangeText={(val) => updateField('partner_phone', val)}
                keyboardType="phone-pad"
              />

              <Input
                label="Observações da Rede de Apoio"
                placeholder="Ex: Mãe presente, sogra ajudando no pós-parto..."
                value={formData.support_network_notes || ''}
                onChangeText={(val) => updateField('support_network_notes', val)}
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: CÁLCULO OBSTÉTRICO (DUM vs ULTRASSOM)           */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <View>
            <View className="mb-6 pb-4 border-b border-cream-300 dark:border-dark-border">
              <Text className="text-lg font-bold text-gray-800 dark:text-cream">
                2. Cálculo Obstétrico & Previsão do Parto (RN01)
              </Text>
              <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
                Escolha o método clínico para estabelecer a DUM efetiva e a DPP de 40 semanas (280 dias).
              </Text>
            </View>

            {/* Method Toggle Chips */}
            <SelectChips
              label="Método de Aferição Obstétrica *"
              value={formData.calc_method}
              onChange={(method) => updateField('calc_method', method as 'DUM' | 'ULTRASOUND')}
              variant="terracotta"
              options={[
                {
                  value: 'DUM',
                  label: 'Data da Última Menstruação (DUM)',
                  badge: 'Padrão',
                  description: 'Ideal para ciclos regulares conhecidos.',
                },
                {
                  value: 'ULTRASOUND',
                  label: '1º Ultrassom Obstétrico (IG Corrigida)',
                  badge: 'Mais Preciso',
                  description: 'Retrocede dias a partir do exame precoce.',
                },
              ]}
            />

            {/* Method Inputs */}
            {formData.calc_method === 'DUM' ? (
              <View className="bg-cream-50 dark:bg-dark-surface p-4 rounded-2xl border border-cream-300 dark:border-dark-border mb-6">
                <Input
                  label="Data da DUM (Primeiro dia da última menstruação) *"
                  placeholder="AAAA-MM-DD (Ex: 2026-01-15)"
                  value={formData.dum_date || ''}
                  onChangeText={(val) => updateField('dum_date', val)}
                  error={stepErrors.dum_date}
                  hint="Informe no formato AAAA-MM-DD. O motor calcula a idade gestacional e DPP instantaneamente."
                />
              </View>
            ) : (
              <View className="bg-cream-50 dark:bg-dark-surface p-4 rounded-2xl border border-cream-300 dark:border-dark-border mb-6">
                <Text className="text-xs font-bold text-gray-700 dark:text-cream mb-3">
                  Dados do Primeiro Ultrassom
                </Text>

                <Input
                  label="Data da Realização do Ultrassom *"
                  placeholder="AAAA-MM-DD (Ex: 2026-03-01)"
                  value={formData.ultrasound_date || ''}
                  onChangeText={(val) => updateField('ultrasound_date', val)}
                  error={stepErrors.ultrasound_date}
                />

                <View className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <NumberStepper
                    label="Semanas no Ultrassom"
                    sublabel="Idade gestacional pelo laudo"
                    value={formData.ultrasound_weeks || 8}
                    min={1}
                    max={42}
                    onChange={(val) => updateField('ultrasound_weeks', val)}
                    suffix="sem"
                  />

                  <NumberStepper
                    label="Dias Adicionais no Ultrassom"
                    sublabel="Ex: 8 semanas e 3 dias"
                    value={formData.ultrasound_days || 0}
                    min={0}
                    max={6}
                    onChange={(val) => updateField('ultrasound_days', val)}
                    suffix="dias"
                  />
                </View>
              </View>
            )}

            {/* Error banner if calculation error exists */}
            {stepErrors.calc && (
              <View className="flex-row items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 p-3 rounded-xl mb-4">
                <AlertCircle size={16} color="#E11D48" />
                <Text className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {stepErrors.calc}
                </Text>
              </View>
            )}

            {/* Live Obstetric Preview Card */}
            <ObstetricPreviewCard preview={livePreview} />
          </View>
        )}

        {/* ======================================================== */}
        {/* PASSO 3: HISTÓRICO OBSTÉTRICO & SAÚDE                    */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <View>
            <View className="mb-6 pb-4 border-b border-cream-300 dark:border-dark-border">
              <Text className="text-lg font-bold text-gray-800 dark:text-cream">
                3. Histórico Obstétrico (G/P/A) & Saúde Fisiológica
              </Text>
              <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
                Fórmula obstétrica canônica: Gravidez Atual (G) = Partos Normais + Cesáreas + Abortos + 1.
              </Text>
            </View>

            {/* Height, Weight & BMI */}
            <View className="bg-cream-50 dark:bg-dark-surface p-4 rounded-2xl border border-cream-300 dark:border-dark-border mb-6">
              <Text className="text-xs font-bold text-gray-800 dark:text-cream mb-3">
                Biometria Pré-Gestacional
              </Text>

              <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input
                  label="Altura (cm)"
                  placeholder="Ex: 165"
                  value={formData.height_cm ? String(formData.height_cm) : ''}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    updateField('height_cm', isNaN(parsed) ? null : parsed);
                  }}
                  keyboardType="numeric"
                  hint="Em centímetros (ex: 165)"
                />

                <Input
                  label="Peso Pré-Gestacional (kg)"
                  placeholder="Ex: 62.5"
                  value={formData.pre_pregnancy_weight_kg ? String(formData.pre_pregnancy_weight_kg) : ''}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    updateField('pre_pregnancy_weight_kg', isNaN(parsed) ? null : parsed);
                  }}
                  keyboardType="numeric"
                  hint="Ponto de partida para a curva de peso."
                />
              </View>

              {/* BMI Auto-Calculation Badge */}
              {bmiInfo && (
                <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-cream-300 dark:border-dark-border">
                  <Activity size={16} color="#6B8E78" />
                  <Text className="text-xs text-gray-700 dark:text-cream">
                    IMC Pré-Gestacional Calculado: <Text className="font-bold">{bmiInfo.bmi} kg/m²</Text>
                  </Text>
                  <View className={`px-2 py-0.5 rounded-full ${bmiInfo.color}`}>
                    <Text className="text-[11px] font-bold">{bmiInfo.label}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Blood Type Chips */}
            <SelectChips
              label="Tipo Sanguíneo & Fator Rh"
              value={formData.blood_type || 'O+'}
              onChange={(type) => updateField('blood_type', type)}
              variant="sage"
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
                { value: 'UNKNOWN', label: 'Desconhecido' },
              ]}
            />

            {/* Obstetric Steppers G / PN / PC / A */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-gray-800 dark:text-cream mb-3">
                Histórico Obstétrico de Gestações e Partos (G / P / A)
              </Text>

              <View className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <NumberStepper
                  label="Gestações (G)"
                  sublabel="Inclui a gestação atual"
                  value={formData.gravida_count}
                  min={1}
                  max={20}
                  onChange={(val) => updateField('gravida_count', val)}
                />

                <NumberStepper
                  label="Partos Vaginais / Normais (PN)"
                  sublabel="Nascimentos normais anteriores"
                  value={formData.vaginal_births_count}
                  min={0}
                  max={20}
                  onChange={(val) => updateField('vaginal_births_count', val)}
                />

                <NumberStepper
                  label="Cesáreas Anteriores (PC)"
                  sublabel="Cirurgias prévias"
                  value={formData.cesarean_count}
                  min={0}
                  max={20}
                  onChange={(val) => updateField('cesarean_count', val)}
                />

                <NumberStepper
                  label="Abortos / Perdas (A)"
                  sublabel="Interrupções prévias"
                  value={formData.abortions_count}
                  min={0}
                  max={20}
                  onChange={(val) => updateField('abortions_count', val)}
                />
              </View>

              {/* Obstetric Consistency Notice */}
              {obstetricCheck.message && (
                <View className="flex-row items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 p-3 rounded-xl">
                  <AlertCircle size={16} color="#D97706" />
                  <Text className="text-xs text-amber-800 dark:text-amber-200 flex-1 leading-relaxed">
                    {obstetricCheck.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Health Conditions and Medications */}
            <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input
                label="Condições Clínicas Relevantes"
                placeholder="Ex: Hipotireoidismo, histórico de pré-eclâmpsia..."
                value={formData.health_conditions || ''}
                onChangeText={(val) => updateField('health_conditions', val)}
              />

              <Input
                label="Medicações e Suplementos em Uso"
                placeholder="Ex: Ácido fólico 5mg, Ferro, Levotiroxina 50mcg..."
                value={formData.medications_in_use || ''}
                onChangeText={(val) => updateField('medications_in_use', val)}
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* PASSO 4: DESEJOS DE PARTO & NOTAS DA DOULA              */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <View>
            <View className="mb-6 pb-4 border-b border-cream-300 dark:border-dark-border">
              <Text className="text-lg font-bold text-gray-800 dark:text-cream">
                4. Desejos de Parto & Anotações Privadas da Doula
              </Text>
              <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
                Expectativas da gestante para o parto e suas observações confidenciais de especialista.
              </Text>
            </View>

            {/* Birth Type Chips */}
            <SelectChips
              label="Via de Parto Almejada / Preferência Inicial"
              value={formData.desired_birth_type || 'Parto Normal Humanizado'}
              onChange={(val) => updateField('desired_birth_type', val)}
              variant="terracotta"
              options={[
                { value: 'Parto Normal Humanizado', label: 'Parto Normal Humanizado' },
                { value: 'Parto Domiciliar Planejado', label: 'Parto Domiciliar' },
                { value: 'Cesárea a Pedido / Agendada', label: 'Cesárea' },
                { value: 'Aberta a Orientações da Doula', label: 'Aberta a Orientações' },
              ]}
            />

            <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input
                label="Maternidade / Hospital Planejado"
                placeholder="Ex: Hospital Santa Joana, Pro Matre..."
                value={formData.target_maternity_hospital || ''}
                onChangeText={(val) => updateField('target_maternity_hospital', val)}
              />

              <Input
                label="Obstetra / Equipe Médica de Acompanhamento"
                placeholder="Ex: Dra. Mariana Costa (CRM 12345)"
                value={formData.obstetrician_name || ''}
                onChangeText={(val) => updateField('obstetrician_name', val)}
              />
            </View>

            {/* Doula Private Notes with Clear Security Notice */}
            <View className="mt-4 pt-4 border-t border-cream-300 dark:border-dark-border">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-6 h-6 rounded-lg bg-terracotta/20 items-center justify-center">
                  <Lock size={14} color="#D97757" />
                </View>
                <Text className="text-xs font-bold text-terracotta-900 dark:text-rose-200">
                  Notas Privadas da Doula (Confidencial)
                </Text>
              </View>

              <View className="bg-terracotta-50/50 dark:bg-dark-surface p-3 rounded-xl border border-terracotta-200 dark:border-dark-border mb-3">
                <Text className="text-[11px] text-terracotta-800 dark:text-terracotta-200 leading-relaxed font-medium">
                  🔒 Este campo é visível APENAS para você no seu prontuário de Doula. A gestante NÃO tem acesso a este texto em nenhum momento no aplicativo dela.
                </Text>
              </View>

              <Input
                placeholder="Ex: Gestante com ansiedade moderada sobre a dor do trabalho de parto. Parceiro muito receptivo às massagens de alívio. Focar em técnicas de respiração e banho morno..."
                value={formData.doula_private_notes || ''}
                onChangeText={(val) => updateField('doula_private_notes', val)}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* PASSO 5: DADOS DO BEBÊ & REVISÃO FINAL                   */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <View>
            <View className="mb-6 pb-4 border-b border-cream-300 dark:border-dark-border">
              <Text className="text-lg font-bold text-gray-800 dark:text-cream">
                5. Dados Iniciais do Bebê & Revisão
              </Text>
              <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
                Como nos referiremos ao bebê carinhosamente durante todo o acompanhamento.
              </Text>
            </View>

            <View className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input
                label="Apelido / Nome de Afeição do Bebê *"
                placeholder="Ex: Maya, Theo, Pipoquinha..."
                value={formData.nickname}
                onChangeText={(val) => updateField('nickname', val)}
                error={stepErrors.nickname}
                hint="Aparecerá na saudação da Home e no topo do diário da gestante."
              />

              <Input
                label="Nome Oficial Registrado (se já escolhido)"
                placeholder="Ex: Maya Santos Ferreira"
                value={formData.official_name || ''}
                onChangeText={(val) => updateField('official_name', val)}
              />
            </View>

            {/* Gender Chips */}
            <SelectChips
              label="Sexo do Bebê"
              value={formData.gender}
              onChange={(val) => updateField('gender', val as any)}
              variant="sage"
              options={[
                { value: 'FEMALE', label: '🌸 Menina' },
                { value: 'MALE', label: '💙 Menino' },
                { value: 'SURPRISE', label: '🎁 Surpresa no Parto' },
                { value: 'UNKNOWN', label: '❓ Ainda Não Sei' },
              ]}
            />

            <Input
              label="Peso Estimado no Último Ultrassom (em gramas)"
              placeholder="Ex: 650 (opcional)"
              value={formData.estimated_weight_g ? String(formData.estimated_weight_g) : ''}
              onChangeText={(val) => {
                const parsed = parseInt(val, 10);
                updateField('estimated_weight_g', isNaN(parsed) ? null : parsed);
              }}
              keyboardType="numeric"
              hint="Preencha se a gestante já tiver um peso estimado recente."
            />

            {/* Summary Review Card */}
            <View className="mt-4 bg-cream-100 dark:bg-dark-surface p-4 rounded-2xl border border-cream-300 dark:border-dark-border">
              <View className="flex-row items-center gap-2 mb-3">
                <CheckCircle size={16} color="#6B8E78" />
                <Text className="text-xs font-bold text-gray-800 dark:text-cream">
                  Resumo da Ficha de Anamnese
                </Text>
              </View>

              <View className="space-y-1.5 text-xs text-gray-600 dark:text-dark-text">
                <Text className="text-xs">
                  • <Text className="font-semibold text-gray-800 dark:text-cream">Gestante:</Text> {formData.full_name || '-'} ({formData.email})
                </Text>
                <Text className="text-xs">
                  • <Text className="font-semibold text-gray-800 dark:text-cream">Bebê:</Text> {formData.nickname} ({formData.gender === 'FEMALE' ? 'Menina' : formData.gender === 'MALE' ? 'Menino' : 'A definir'})
                </Text>
                <Text className="text-xs">
                  • <Text className="font-semibold text-gray-800 dark:text-cream">Idade Gestacional Hoje:</Text> {livePreview.gestationalAge?.formatted || 'Aguardando cálculo'}
                </Text>
                <Text className="text-xs">
                  • <Text className="font-semibold text-gray-800 dark:text-cream">Data Provável do Parto (DPP):</Text> {livePreview.dppDate || 'Aguardando cálculo'}
                </Text>
                <Text className="text-xs">
                  • <Text className="font-semibold text-gray-800 dark:text-cream">G / P / A:</Text> G{formData.gravida_count} P{formData.vaginal_births_count + formData.cesarean_count} A{formData.abortions_count}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Wizard Footer Navigation Buttons */}
        <View className="flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-cream-300 dark:border-dark-border">
          <Button
            variant="outline"
            size="md"
            onPress={handlePrevious}
            className="w-full sm:w-auto"
          >
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStep < 5 ? (
            <Button
              variant="sage"
              size="md"
              onPress={handleNext}
              icon={<ArrowRight size={16} color="#FFFFFF" />}
              className="w-full sm:w-auto"
            >
              Avançar para Passo {currentStep + 1}
            </Button>
          ) : (
            <Button
              variant="terracotta"
              size="lg"
              onPress={handleSubmit}
              loading={isSubmitting}
              icon={<Sparkles size={18} color="#FFFFFF" />}
              className="w-full sm:w-auto"
            >
              Finalizar Cadastro & Gerar Acesso
            </Button>
          )}
        </View>
      </View>

      {/* WhatsApp Success Modal */}
      <WhatsAppModal
        visible={showSuccessModal}
        provisioningResult={provisioningResult}
        onClose={() => setShowSuccessModal(false)}
      />
    </ScrollView>
  );
}
