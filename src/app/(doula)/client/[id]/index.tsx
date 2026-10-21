import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  User,
  Baby as BabyIcon,
  Calendar,
  FileText,
  AlertTriangle,
  HeartHandshake,
  Phone,
  Clock,
  BookOpen,
  Filter,
  CheckCircle2,
  Stethoscope,
  Heart,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react-native';
import { useClientDossier, useMarkLogSeen } from '@/hooks/useDiary';
import { DailyLogCard } from '@/components/doula/DailyLogCard';
import { formatGestationalAge, normalizeToUtcDate } from '@/lib/obstetrics';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pregnancyId = (id as string) || 'p-camila-01';

  const { data: dossier, isLoading, refetch } = useClientDossier(pregnancyId);
  const markSeenMutation = useMarkLogSeen();

  const [filterMode, setFilterMode] = useState<'ALL' | 'RED_FLAGS'>('ALL');

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream dark:bg-dark-bg items-center justify-center p-6">
        <ActivityIndicator size="large" color="#6B8E78" />
        <Text className="text-sm font-semibold text-gray-700 dark:text-cream mt-3">
          Carregando Prontuário 360º...
        </Text>
      </View>
    );
  }

  if (!dossier) {
    return (
      <ScrollView contentContainerClassName="p-6 max-w-3xl mx-auto w-full">
        <Pressable
          onPress={() => router.push('/(doula)/dashboard')}
          className="flex-row items-center gap-1.5 mb-6"
        >
          <ArrowLeft size={16} color="#6B8E78" />
          <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">
            Voltar ao Painel
          </Text>
        </Pressable>

        <View className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-cream-300 dark:border-dark-border items-center justify-center text-center">
          <Text className="text-base font-bold text-gray-800 dark:text-cream">
            Cliente não encontrada
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
            Não foi possível carregar os dados desta gestação.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const { pregnancy, pregnantProfile, baby, logs, gestationalAge, activeRedFlagsCount } = dossier;

  const filteredLogs = logs.filter((log) => {
    if (filterMode === 'RED_FLAGS') {
      return log.has_red_flag;
    }
    return true;
  });

  const redFlagsTotal = logs.filter((l) => l.has_red_flag).length;

  const handleMarkSeen = async (logId: string) => {
    await markSeenMutation.mutateAsync({ pregnancyId, logId });
  };

  const handleOpenWhatsApp = () => {
    const phone = pregnantProfile.phone?.replace(/\D/g, '');
    const url = phone ? `https://wa.me/55${phone}` : 'https://wa.me/';
    Linking.openURL(url).catch(() => {});
  };

  const formatDppDate = (dppStr: string) => {
    const d = normalizeToUtcDate(dppStr);
    const day = d.getUTCDate();
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${day} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  };

  return (
    <ScrollView
      contentContainerClassName="p-4 sm:p-8 max-w-5xl mx-auto w-full pb-20"
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Back button */}
      <Pressable
        testID="btn-back-dashboard"
        onPress={() => router.push('/(doula)/dashboard')}
        className="flex-row items-center gap-1.5 mb-6 self-start px-2 py-1 rounded-xl bg-white/70 dark:bg-dark-card border border-cream-300 dark:border-dark-border active:bg-cream"
      >
        <ArrowLeft size={16} color="#6B8E78" />
        <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">
          Voltar ao Painel de Gestantes
        </Text>
      </Pressable>

      {/* 2. Client Header 360º Card */}
      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-3xl p-6 mb-6 shadow-sm">
        <View className="flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Identity */}
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-3xl bg-terracotta-100 dark:bg-terracotta-900/40 items-center justify-center border border-terracotta-200">
              <Text className="text-2xl font-bold text-terracotta">
                {pregnantProfile.full_name.charAt(0)}
              </Text>
            </View>

            <View>
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-cream">
                  {pregnantProfile.full_name}
                </Text>
                {activeRedFlagsCount > 0 ? (
                  <View className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 border border-rose-300 flex-row items-center gap-1">
                    <ShieldAlert size={12} color="#E05252" />
                    <Text className="text-[10px] font-bold text-rose-800 dark:text-rose-200">
                      Alerta Obstétrico Ativo
                    </Text>
                  </View>
                ) : (
                  <View className="px-2.5 py-0.5 rounded-full bg-sage-50 dark:bg-sage-950/40 border border-sage-200">
                    <Text className="text-[10px] font-semibold text-sage-800 dark:text-sage-300">
                      Gestação Ativa
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-3 mt-1 flex-wrap">
                <View className="flex-row items-center gap-1">
                  <BabyIcon size={14} color="#6B8E78" />
                  <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">
                    Bebê {baby?.nickname || 'Bebê'}{' '}
                    {baby?.gender === 'FEMALE'
                      ? '👧'
                      : baby?.gender === 'MALE'
                      ? '👦'
                      : '👶'}
                  </Text>
                </View>

                {pregnantProfile.phone && (
                  <Text className="text-xs text-gray-500 dark:text-dark-subtext">
                    {pregnantProfile.phone}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Quick Contact Actions */}
          <View className="flex-row items-center gap-2 self-start md:self-auto">
            <Pressable
              testID="btn-dossier-whatsapp"
              onPress={handleOpenWhatsApp}
              className="bg-sage active:bg-sage-600 px-4 py-2.5 rounded-2xl flex-row items-center gap-1.5 shadow-xs"
            >
              <HeartHandshake size={15} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">WhatsApp</Text>
            </Pressable>

            {pregnantProfile.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${pregnantProfile.phone}`)}
                className="bg-cream dark:bg-dark-surface border border-cream-400 dark:border-dark-border px-3.5 py-2.5 rounded-2xl flex-row items-center gap-1.5 active:bg-cream-200"
              >
                <Phone size={14} color="#6B8E78" />
                <Text className="text-xs font-semibold text-gray-700 dark:text-cream">Ligar</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Gestational Progress Banner */}
        <View className="mt-6 bg-cream/70 dark:bg-dark-surface/60 rounded-2xl p-4 border border-cream-300 dark:border-dark-border">
          <View className="flex-row justify-between items-center mb-1.5 flex-wrap gap-2">
            <View className="flex-row items-center gap-2">
              <View className="px-2.5 py-0.5 rounded-lg bg-terracotta/15">
                <Text className="text-xs font-bold text-terracotta">
                  {gestationalAge.formattedShort}
                </Text>
              </View>
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                {gestationalAge.formatted}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">
                DPP: <Text className="font-semibold text-gray-800 dark:text-cream">{formatDppDate(pregnancy.dpp_date)}</Text>
              </Text>
              <Text className="text-xs font-semibold text-sage">
                ({gestationalAge.daysRemaining} dias restantes)
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="w-full h-2.5 bg-cream-300 dark:bg-dark-border rounded-full overflow-hidden mt-2">
            <View
              className="h-full bg-sage rounded-full"
              style={{ width: `${gestationalAge.progressPercentage}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-1.5">
            <Text className="text-[10px] text-gray-400">DUM: {pregnancy.effective_dum}</Text>
            <Text className="text-[10px] font-semibold text-sage-800 dark:text-sage-300">
              {gestationalAge.progressPercentage}% da gestação • {gestationalAge.trimester}º Trimestre
            </Text>
          </View>
        </View>

        {/* Navigation Tabs Bar inside Dossier */}
        <View className="flex-row gap-2 mt-5 flex-wrap">
          <Pressable
            testID="btn-dossier-schedule"
            onPress={() => router.push(`/(doula)/client/${pregnancyId}/schedule` as any)}
            className="bg-cream dark:bg-dark-surface px-4 py-2 rounded-xl flex-row items-center gap-2 border border-cream-300 dark:border-dark-border active:bg-cream-200"
          >
            <Calendar size={14} color="#6B8E78" />
            <Text className="text-xs font-semibold text-sage-800 dark:text-cream">
              Prescrições & Agenda
            </Text>
          </Pressable>

          <Pressable
            testID="btn-dossier-anamnesis-edit"
            onPress={() => router.push(`/(doula)/client/${pregnancyId}/anamnesis-edit` as any)}
            className="bg-cream dark:bg-dark-surface px-4 py-2 rounded-xl flex-row items-center gap-2 border border-cream-300 dark:border-dark-border active:bg-cream-200"
          >
            <FileText size={14} color="#D97757" />
            <Text className="text-xs font-semibold text-terracotta-800 dark:text-cream">
              Editar Anamnese
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Obstetric Alert Banner if Active Red Flag exists */}
      {activeRedFlagsCount > 0 && (
        <View className="bg-rose-100/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-3xl p-5 mb-6 shadow-xs flex-row items-start gap-3">
          <AlertTriangle size={22} color="#E05252" className="mt-0.5" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Atenção Prioritária: {activeRedFlagsCount} Alerta(s) Obstétrico(s) Pendente(s)
            </Text>
            <Text className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
              Esta gestante registrou sintomas críticos recentemente no diário. Verifique os
              detalhes no histórico abaixo, ofereça acolhimento imediato e certifique-se de que ela
              passou por avaliação médica.
            </Text>
          </View>
        </View>
      )}

      {/* 4. Obstetric Summary Details (Grid) */}
      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-3xl p-5 mb-6 shadow-xs">
        <Text className="text-sm font-bold text-gray-800 dark:text-cream mb-3 flex-row items-center gap-1.5">
          Resumo Obstétrico & Plano de Parto
        </Text>

        <View className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <View className="bg-cream-100/60 dark:bg-dark-surface p-3 rounded-2xl border border-cream-200 dark:border-dark-border">
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Histórico G/P/A</Text>
            <Text className="text-xs font-bold text-gray-800 dark:text-cream mt-0.5">
              G{pregnancy.gravida_count} P{pregnancy.vaginal_births_count + pregnancy.cesarean_count} A{pregnancy.abortions_count}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-0.5">
              {pregnancy.vaginal_births_count} Normal • {pregnancy.cesarean_count} Cesárea
            </Text>
          </View>

          <View className="bg-cream-100/60 dark:bg-dark-surface p-3 rounded-2xl border border-cream-200 dark:border-dark-border">
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Parto Desejado</Text>
            <Text className="text-xs font-bold text-gray-800 dark:text-cream mt-0.5" numberOfLines={1}>
              {pregnancy.desired_birth_type || 'Humanizado'}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-0.5" numberOfLines={1}>
              {pregnancy.target_maternity_hospital || 'Maternidade a definir'}
            </Text>
          </View>

          <View className="bg-cream-100/60 dark:bg-dark-surface p-3 rounded-2xl border border-cream-200 dark:border-dark-border">
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Obstetra / Apoio</Text>
            <Text className="text-xs font-bold text-gray-800 dark:text-cream mt-0.5" numberOfLines={1}>
              {pregnancy.obstetrician_name || 'Não informado'}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-0.5" numberOfLines={1}>
              Parceiro: {pregnancy.partner_name || 'Sim'}
            </Text>
          </View>

          <View className="bg-cream-100/60 dark:bg-dark-surface p-3 rounded-2xl border border-cream-200 dark:border-dark-border">
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Biometria Inicial</Text>
            <Text className="text-xs font-bold text-gray-800 dark:text-cream mt-0.5">
              {pregnancy.pre_pregnancy_weight_kg ? `${pregnancy.pre_pregnancy_weight_kg} kg` : '--'} •{' '}
              {pregnancy.height_cm ? `${pregnancy.height_cm} cm` : '--'}
            </Text>
            <Text className="text-[10px] text-gray-400 mt-0.5">
              Tipo: {pregnancy.blood_type || 'Não informado'}
            </Text>
          </View>
        </View>

        {pregnancy.doula_private_notes && (
          <View className="mt-3 bg-amber-50/70 dark:bg-dark-surface p-3 rounded-2xl border border-amber-200 dark:border-dark-border">
            <Text className="text-[10px] font-bold text-amber-900 dark:text-amber-200 mb-0.5">
              Notas Privadas da Doula (Sigiloso):
            </Text>
            <Text className="text-xs text-gray-700 dark:text-dark-text italic">
              "{pregnancy.doula_private_notes}"
            </Text>
          </View>
        )}
      </View>

      {/* 5. Histórico do Diário da Gestante (FEATURE 04) */}
      <View className="mb-4 flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-terracotta/10 items-center justify-center">
            <BookOpen size={16} color="#D97757" />
          </View>
          <View>
            <Text className="text-base font-bold text-gray-900 dark:text-cream">
              Histórico do Diário Perinatal
            </Text>
            <Text className="text-xs text-gray-500 dark:text-dark-subtext">
              {logs.length} registro(s) de sentimentos, sintomas físicos e movimentação
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View className="flex-row items-center gap-1.5">
          <Pressable
            testID="filter-all-logs"
            onPress={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl border text-xs ${
              filterMode === 'ALL'
                ? 'bg-sage border-sage shadow-xs'
                : 'bg-white dark:bg-dark-card border-cream-300 dark:border-dark-border'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterMode === 'ALL' ? 'text-white' : 'text-gray-700 dark:text-cream'
              }`}
            >
              Todos ({logs.length})
            </Text>
          </Pressable>

          <Pressable
            testID="filter-red-flags"
            onPress={() => setFilterMode('RED_FLAGS')}
            className={`px-3 py-1.5 rounded-xl border text-xs flex-row items-center gap-1 ${
              filterMode === 'RED_FLAGS'
                ? 'bg-rose-600 border-rose-600 shadow-xs'
                : 'bg-white dark:bg-dark-card border-cream-300 dark:border-dark-border'
            }`}
          >
            <AlertTriangle
              size={12}
              color={filterMode === 'RED_FLAGS' ? '#FFFFFF' : '#E05252'}
            />
            <Text
              className={`text-xs font-semibold ${
                filterMode === 'RED_FLAGS' ? 'text-white' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              Alertas ({redFlagsTotal})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* List of Daily Logs */}
      {filteredLogs.length > 0 ? (
        <View>
          {filteredLogs.map((log) => (
            <DailyLogCard
              key={log.id}
              log={log}
              pregnantName={pregnantProfile.full_name}
              pregnantPhone={pregnantProfile.phone}
              onMarkSeen={handleMarkSeen}
              isMarkingSeen={markSeenMutation.isPending}
            />
          ))}
        </View>
      ) : (
        /* Empty State */
        <View className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-cream-300 dark:border-dark-border items-center justify-center text-center my-4 shadow-2xs">
          <View className="w-14 h-14 rounded-2xl bg-cream-200 dark:bg-dark-surface items-center justify-center mb-3">
            <BookOpen size={24} color="#6B8E78" />
          </View>
          <Text className="text-base font-bold text-gray-800 dark:text-cream">
            {filterMode === 'RED_FLAGS'
              ? 'Nenhum alerta crítico registrado'
              : 'Nenhum registro de diário encontrado'}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1 max-w-sm text-center">
            {filterMode === 'RED_FLAGS'
              ? 'Esta gestante não possui sintomas críticos ou movimentação diminuída registrados.'
              : 'Assim que a gestante registrar sintomas, peso e sentimentos no diário dela, eles aparecerão aqui para seu acompanhamento.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
