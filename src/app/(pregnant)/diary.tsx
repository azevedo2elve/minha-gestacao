import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Scale,
  Baby,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Save,
  Smile,
  Moon,
  Droplets,
  Stethoscope,
  Info,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePregnantHome } from '@/hooks/useDashboard';
import { useDailyLog, useSaveDailyLog } from '@/hooks/useDiary';
import { DateSelector } from '@/components/pregnant/DateSelector';
import { MultiSelectChips } from '@/components/ui/MultiSelectChips';
import { RatingSelector } from '@/components/pregnant/RatingSelector';
import { RedFlagAlertModal } from '@/components/pregnant/RedFlagAlertModal';
import { Input } from '@/components/ui/Input';
import {
  MOOD_OPTIONS,
  COMMON_SYMPTOM_OPTIONS,
  CRITICAL_SYMPTOM_OPTIONS,
  FETAL_MOVEMENT_OPTIONS,
  SLEEP_QUALITY_OPTIONS,
  HYDRATION_LEVEL_OPTIONS,
} from '@/constants/diary';
import {
  formatToIsoDateString,
  normalizeToUtcDate,
  getGestationalAge,
  hasObstetricRedFlag,
} from '@/lib/obstetrics';
import { FetalMovementLevel } from '@/types/database';

export default function PregnantDiaryScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { data: homeData, isLoading: isLoadingHome } = usePregnantHome(profile);

  const pregnancy = homeData?.pregnancy;
  // Default to 171 days ago (~24w 3d) to match Maria & Theo profile if pregnancy is still loading
  const effectiveDum =
    pregnancy?.effective_dum ||
    formatToIsoDateString(normalizeToUtcDate(new Date(Date.now() - 171 * 86400000)));
  const pregnancyId = pregnancy?.id || 'mock-pregnancy-active';

  // Date selection state
  const todayIso = formatToIsoDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Form states
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [commonSymptomTags, setCommonSymptomTags] = useState<string[]>([]);
  const [criticalSymptomTags, setCriticalSymptomTags] = useState<string[]>([]);
  const [fetalMovement, setFetalMovement] = useState<FetalMovementLevel>('NORMAL');
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [hydrationLevel, setHydrationLevel] = useState<number>(3);
  const [motherWeightKg, setMotherWeightKg] = useState<string>('');
  const [babyEstimatedWeightG, setBabyEstimatedWeightG] = useState<string>('');
  const [bloodPressure, setBloodPressure] = useState<string>('');
  const [nutritionNotes, setNutritionNotes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const [alertReasons, setAlertReasons] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data fetching & saving hooks
  const { data: existingLog, isLoading: isLoadingLog } = useDailyLog(pregnancyId, selectedDate);
  const saveDailyLogMutation = useSaveDailyLog();

  // Populate or reset form whenever existingLog or selectedDate changes
  useEffect(() => {
    if (existingLog) {
      setMoodTags(existingLog.mood_tags || []);

      const common = (existingLog.symptom_tags || []).filter((tag) =>
        COMMON_SYMPTOM_OPTIONS.some((opt) => opt.value === tag)
      );
      const critical = (existingLog.symptom_tags || []).filter((tag) =>
        CRITICAL_SYMPTOM_OPTIONS.some((opt) => opt.value === tag)
      );

      setCommonSymptomTags(common);
      setCriticalSymptomTags(critical);
      setFetalMovement(existingLog.fetal_movement || 'NORMAL');
      setSleepQuality(existingLog.sleep_quality ?? 3);
      setHydrationLevel(existingLog.hydration_level ?? 3);
      setMotherWeightKg(existingLog.mother_weight_kg ? String(existingLog.mother_weight_kg) : '');
      setBabyEstimatedWeightG(
        existingLog.baby_estimated_weight_g ? String(existingLog.baby_estimated_weight_g) : ''
      );
      setBloodPressure(existingLog.blood_pressure || '');
      setNutritionNotes(existingLog.nutrition_notes || '');
      setNotes(existingLog.notes || '');

      if (
        existingLog.mother_weight_kg ||
        existingLog.baby_estimated_weight_g ||
        existingLog.blood_pressure ||
        existingLog.nutrition_notes
      ) {
        setIsAccordionOpen(true);
      }
    } else {
      // Clear fields for new entry
      setMoodTags([]);
      setCommonSymptomTags([]);
      setCriticalSymptomTags([]);
      setFetalMovement('NORMAL');
      setSleepQuality(3);
      setHydrationLevel(3);
      setMotherWeightKg('');
      setBabyEstimatedWeightG('');
      setBloodPressure('');
      setNutritionNotes('');
      setNotes('');
    }
  }, [existingLog, selectedDate]);

  // Gestational Age at the selected date
  const gaAtDate = getGestationalAge(effectiveDum, selectedDate);

  // Check if current draft contains red flags
  const combinedSymptomTags = [...commonSymptomTags, ...criticalSymptomTags];
  const draftHasRedFlag = hasObstetricRedFlag({
    symptomTags: combinedSymptomTags,
    fetalMovement,
    gestationalWeeks: gaAtDate.weeks,
  });

  const handleSave = async () => {
    setSuccessMessage(null);

    const payload = {
      pregnancyId,
      logDate: selectedDate,
      effectiveDum,
      moodTags,
      symptomTags: combinedSymptomTags,
      fetalMovement,
      sleepQuality,
      hydrationLevel,
      motherWeightKg: motherWeightKg ? parseFloat(motherWeightKg.replace(',', '.')) : null,
      babyEstimatedWeightG: babyEstimatedWeightG ? parseInt(babyEstimatedWeightG, 10) : null,
      bloodPressure: bloodPressure.trim() || null,
      nutritionNotes: nutritionNotes.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const result = await saveDailyLogMutation.mutateAsync(payload);

      if (result.success) {
        if (result.hasRedFlag) {
          setAlertReasons(result.redFlagReasons);
          setAlertModalVisible(true);
          setSuccessMessage('Diário salvo! Alerta obstétrico prioritário registrado.');
        } else {
          setSuccessMessage('Diário salvo com carinho e acolhimento! 🌸');
        }

        setTimeout(() => {
          setSuccessMessage(null);
        }, 4000);
      }
    } catch {
      // Save errors handled gracefully
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerClassName="p-4 sm:p-6 max-w-2xl mx-auto w-full pb-20"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation & Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            testID="btn-back-home"
            onPress={() => router.push('/(pregnant)/home')}
            className="flex-row items-center gap-1.5 py-1 px-2 rounded-xl bg-white/70 dark:bg-dark-card border border-cream-300 dark:border-dark-border active:bg-cream"
          >
            <ArrowLeft size={16} color="#6B8E78" />
            <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">Início</Text>
          </Pressable>

          <View className="px-3 py-1 bg-terracotta/10 rounded-full border border-terracotta/20 flex-row items-center gap-1">
            <BookOpen size={13} color="#D97757" />
            <Text className="text-xs font-bold text-terracotta">Diário da Gestante</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">
            Como você está hoje?
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-0.5">
            Registre suas emoções, sintomas e acompanhe a conexão com seu bebê.
          </Text>
        </View>

        {/* 1. Date Selector (Permite navegar para dias passados) */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          effectiveDum={effectiveDum}
        />

        {/* Existing Log Banner Indicator */}
        {isLoadingLog ? (
          <View className="py-2 items-center justify-center mb-4 flex-row gap-2">
            <ActivityIndicator size="small" color="#6B8E78" />
            <Text className="text-xs text-sage">Carregando dados do dia...</Text>
          </View>
        ) : existingLog ? (
          <View className="bg-sage-50 dark:bg-sage-950/30 border border-sage-200 dark:border-sage-900/40 rounded-2xl p-3 mb-5 flex-row items-center gap-2">
            <CheckCircle2 size={16} color="#6B8E78" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-sage-900 dark:text-sage-200">
                Diário registrado para este dia
              </Text>
              <Text className="text-[11px] text-sage-700 dark:text-sage-400">
                Você pode atualizar ou complementar qualquer informação abaixo.
              </Text>
            </View>
          </View>
        ) : (
          <View className="bg-cream-200/50 dark:bg-dark-surface/40 border border-cream-300 dark:border-dark-border rounded-2xl p-2.5 mb-5 flex-row items-center gap-2">
            <Info size={14} color="#D97757" />
            <Text className="text-[11px] text-gray-600 dark:text-dark-subtext">
              Novo registro de diário. Preencha o que fizer sentido para você.
            </Text>
          </View>
        )}

        {/* Success Toast / Notification */}
        {successMessage && (
          <View
            testID="success-toast"
            className="bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 mb-5 flex-row items-center gap-2 shadow-xs"
          >
            <CheckCircle2 size={18} color="#059669" />
            <Text className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex-1">
              {successMessage}
            </Text>
          </View>
        )}

        {/* 2. Mood & Emotional State Chips */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-cream-300 dark:border-dark-border shadow-xs mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-xl bg-terracotta/10 items-center justify-center">
              <Smile size={16} color="#D97757" />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                Sentimentos & Emoções
              </Text>
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                Selecione tudo o que expressa seu momento hoje
              </Text>
            </View>
          </View>

          <MultiSelectChips
            options={MOOD_OPTIONS}
            values={moodTags}
            onChange={setMoodTags}
            variant="terracotta"
          />
        </View>

        {/* 3. Physical Symptoms Chips (Common & Critical Red Flags) */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-cream-300 dark:border-dark-border shadow-xs mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-xl bg-sage/10 items-center justify-center">
              <Stethoscope size={16} color="#6B8E78" />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                Sintomas Físicos
              </Text>
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                Alterações corporais e sensações habituais
              </Text>
            </View>
          </View>

          {/* Common Symptoms */}
          <MultiSelectChips
            options={COMMON_SYMPTOM_OPTIONS}
            values={commonSymptomTags}
            onChange={setCommonSymptomTags}
            exclusiveValues={['SEM_SINTOMAS']}
            variant="sage"
          />

          {/* Critical Symptoms / Red Flags Section */}
          <View className="mt-2 pt-3 border-t border-rose-200 dark:border-rose-900/40">
            <View className="flex-row items-center gap-1.5 mb-2">
              <AlertTriangle size={14} color="#E05252" />
              <Text className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Sinais de Alerta Obstétrico (Atenção Prioritária - RN04)
              </Text>
            </View>
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext mb-3">
              Marque se estiver sentindo algum destes sinais. Avisaremos sua doula imediatamente e
              daremos orientações seguras.
            </Text>

            <MultiSelectChips
              options={CRITICAL_SYMPTOM_OPTIONS}
              values={criticalSymptomTags}
              onChange={setCriticalSymptomTags}
              variant="rose"
            />
          </View>
        </View>

        {/* 4. Fetal Movement Selector */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-cream-300 dark:border-dark-border shadow-xs mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-xl bg-terracotta/10 items-center justify-center">
              <Baby size={16} color="#D97757" />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                Movimentação do Bebê
              </Text>
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                Como você sentiu os movimentos ao longo do dia?
              </Text>
            </View>
          </View>

          <View className="gap-2">
            {FETAL_MOVEMENT_OPTIONS.map((opt) => {
              const isSelected = fetalMovement === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  testID={`chip-fetal-${opt.value}`}
                  onPress={() => setFetalMovement(opt.value)}
                  className={`p-3 rounded-2xl border transition-all flex-row items-center justify-between ${
                    isSelected
                      ? opt.isWarning
                        ? 'bg-rose-500 border-rose-600 shadow-xs'
                        : 'bg-sage border-sage shadow-xs'
                      : 'bg-cream-100/60 dark:bg-dark-surface border-cream-300 dark:border-dark-border active:bg-cream-200'
                  }`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-base">{opt.emoji}</Text>
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-white font-bold' : 'text-gray-800 dark:text-cream font-medium'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </View>

                  {opt.badge && (
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20'
                          : opt.isWarning
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800'
                          : 'bg-cream-300 dark:bg-dark-border'
                      }`}
                    >
                      <Text
                        className={`text-[9px] ${
                          isSelected
                            ? 'text-white font-semibold'
                            : opt.isWarning
                            ? 'text-rose-700 dark:text-rose-300 font-bold'
                            : 'text-gray-600 dark:text-dark-subtext'
                        }`}
                      >
                        {opt.badge}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Gentle Warning if Decreased and >= 28w */}
          {fetalMovement === 'DECREASED' && gaAtDate.weeks >= 28 && (
            <View className="mt-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-2xl p-3 flex-row items-start gap-2">
              <AlertTriangle size={16} color="#E05252" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Atenção com a movimentação na {gaAtDate.weeks}ª semana
                </Text>
                <Text className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
                  Bebês no 3º trimestre têm padrão de movimento consistente. Se sentir redução
                  acentuada, estimule com líquido gelado, deite de lado por 30 minutos e, se persistir,
                  procure avaliação médica.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 5. Sleep & Hydration Scales */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-cream-300 dark:border-dark-border shadow-xs mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-8 h-8 rounded-xl bg-indigo-500/10 items-center justify-center">
              <Moon size={16} color="#6366F1" />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                Qualidade do Sono & Descanso
              </Text>
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                Como foi sua noite e seus momentos de relaxamento?
              </Text>
            </View>
          </View>

          <RatingSelector
            label="Nível de Sono (1 a 5)"
            value={sleepQuality}
            onChange={setSleepQuality}
            options={SLEEP_QUALITY_OPTIONS}
            variant="purple"
          />

          <View className="mt-2 pt-4 border-t border-cream-200 dark:border-dark-border">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-xl bg-sky-500/10 items-center justify-center">
                <Droplets size={16} color="#0EA5E9" />
              </View>
              <View>
                <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                  Hidratação do Dia
                </Text>
                <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                  Água ingerida (essencial para o líquido amniótico)
                </Text>
              </View>
            </View>

            <RatingSelector
              label="Ingestão de Água (1 a 5)"
              value={hydrationLevel}
              onChange={setHydrationLevel}
              options={HYDRATION_LEVEL_OPTIONS}
              variant="blue"
            />
          </View>
        </View>

        {/* 6. Accordion: Optional Biometrics & Health Metrics (RN03) */}
        <View className="bg-white dark:bg-dark-card rounded-3xl border border-cream-300 dark:border-dark-border shadow-xs mb-5 overflow-hidden">
          <Pressable
            testID="accordion-metrics-toggle"
            onPress={() => setIsAccordionOpen(!isAccordionOpen)}
            className="p-5 flex-row items-center justify-between active:bg-cream-100 dark:active:bg-dark-surface"
          >
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-xl bg-sage/10 items-center justify-center">
                <Scale size={16} color="#6B8E78" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                    Métricas de Peso & Saúde
                  </Text>
                  <View className="px-2 py-0.5 rounded-full bg-cream-300 dark:bg-dark-surface">
                    <Text className="text-[9px] font-semibold text-gray-600 dark:text-dark-subtext">
                      Opcional
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                  Peso materno, peso estimado do bebê por ultrassom e pressão
                </Text>
              </View>
            </View>

            {isAccordionOpen ? (
              <ChevronUp size={20} color="#6B8E78" />
            ) : (
              <ChevronDown size={20} color="#6B8E78" />
            )}
          </Pressable>

          {isAccordionOpen && (
            <View className="p-5 pt-0 border-t border-cream-200 dark:border-dark-border">
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext my-3 leading-relaxed">
                Você não precisa se pesar todos os dias. O aplicativo interpola apenas os dias que
                você preencher para montar sua curva de peso no prontuário.
              </Text>

              <View className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  testID="input-mother-weight"
                  label="Seu Peso Atual (Kg)"
                  placeholder="Ex: 64.5"
                  keyboardType="numeric"
                  value={motherWeightKg}
                  onChangeText={setMotherWeightKg}
                  hint="Opcional. Use ponto ou vírgula."
                />

                <Input
                  testID="input-baby-weight"
                  label="Peso Estimado do Bebê (g)"
                  placeholder="Ex: 850"
                  keyboardType="numeric"
                  value={babyEstimatedWeightG}
                  onChangeText={setBabyEstimatedWeightG}
                  hint="Opcional. Preencha após ultrassom."
                />
              </View>

              <View className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <Input
                  testID="input-blood-pressure"
                  label="Pressão Arterial (PA)"
                  placeholder="Ex: 120/80 ou 12/8"
                  value={bloodPressure}
                  onChangeText={setBloodPressure}
                  hint="Se aferiu em consulta ou em casa."
                />

                <Input
                  testID="input-nutrition"
                  label="Notas de Alimentação"
                  placeholder="Ex: comi frutas, digestão leve..."
                  value={nutritionNotes}
                  onChangeText={setNutritionNotes}
                />
              </View>
            </View>
          )}
        </View>

        {/* 7. Open Diary Notes Section */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-cream-300 dark:border-dark-border shadow-xs mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-8 h-8 rounded-xl bg-terracotta/10 items-center justify-center">
              <Heart size={16} color="#D97757" />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                Anotações do Dia
              </Text>
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
                Escreva seus pensamentos, conversas com o bebê ou dúvidas
              </Text>
            </View>
          </View>

          <Input
            testID="input-notes"
            placeholder="Como você se sentiu hoje? O que mais marcou seu dia na gestação..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Red Flag Warning Alert Indicator if Triggered */}
        {draftHasRedFlag && (
          <View className="bg-rose-100/90 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-3xl p-4 mb-6 flex-row items-start gap-3">
            <AlertTriangle size={20} color="#E05252" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Aviso: Sintomas Críticos Selecionados (RN04)
              </Text>
              <Text className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5 leading-relaxed">
                Ao salvar, exibiremos um canal direto para acionar sua doula e orientações de apoio
                imediato.
              </Text>
            </View>
          </View>
        )}

        {/* Action Button: Save Daily Log */}
        <Pressable
          testID="btn-save-diary"
          disabled={saveDailyLogMutation.isPending}
          onPress={handleSave}
          className={`w-full py-4 px-6 rounded-2xl flex-row items-center justify-center gap-2 shadow-md transition-colors ${
            saveDailyLogMutation.isPending
              ? 'bg-sage-400 opacity-70'
              : draftHasRedFlag
              ? 'bg-terracotta active:bg-terracotta-600'
              : 'bg-sage active:bg-sage-600'
          }`}
        >
          {saveDailyLogMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">
                {existingLog ? 'Atualizar Diário' : 'Salvar Diário com Carinho'}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Red Flag Alert Modal (RN04) */}
      <RedFlagAlertModal
        visible={alertModalVisible}
        onClose={() => setAlertModalVisible(false)}
        doulaPhone={homeData?.doula?.phone}
        doulaName={homeData?.doula?.full_name || 'sua Doula'}
        reasons={alertReasons}
        gestationalAgeText={gaAtDate.formatted}
      />
    </SafeAreaView>
  );
}
