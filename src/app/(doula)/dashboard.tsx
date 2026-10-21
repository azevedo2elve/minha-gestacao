import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  UserPlus,
  Heart,
  Calendar,
  ChevronRight,
  Search,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Sparkles,
  Phone,
  Clock,
  Baby as BabyIcon,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useDoulaDashboard } from '@/hooks/useDashboard';
import { DoulaAvailability } from '@/types/database';
import { formatToIsoDateString } from '@/lib/obstetrics';

type TrimesterFilter = 'ALL' | 'T1' | 'T2' | 'T3' | 'ALERTS';

export default function DoulaDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile } = useAuthStore();

  const {
    data,
    isLoading,
    updateStatus,
    isUpdatingStatus,
    dismissRedFlag,
    isDismissingRedFlag,
  } = useDoulaDashboard(profile?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [trimesterFilter, setTrimesterFilter] = useState<TrimesterFilter>('ALL');

  // Columns: 1 on mobile (<640px), 2 on tablet (640-1024px), 3 on desktop (>=1024px)
  const numColumns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  const currentStatus = data?.doula?.doula_status || 'ONLINE';

  const handleStatusChange = async (status: DoulaAvailability) => {
    if (status === currentStatus || isUpdatingStatus) return;
    await updateStatus({ status });
  };

  const handleDismissRedFlag = async (logId: string) => {
    if (isDismissingRedFlag) return;
    await dismissRedFlag(logId);
  };

  // Filter clients by search query and trimester / alerts
  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    return data.clients.filter((client) => {
      // 1. Search filter
      const matchesSearch =
        client.pregnantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.babyNickname.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Trimester / Alert tab filter
      if (trimesterFilter === 'T1') return client.gestationalAge.trimester === 1;
      if (trimesterFilter === 'T2') return client.gestationalAge.trimester === 2;
      if (trimesterFilter === 'T3') return client.gestationalAge.trimester === 3;
      if (trimesterFilter === 'ALERTS') return client.hasRedFlag;

      return true;
    });
  }, [data?.clients, searchQuery, trimesterFilter]);

  if (isLoading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-cream dark:bg-dark-bg p-8">
        <ActivityIndicator size="large" color="#6B8E78" />
        <Text className="text-sm font-semibold text-sage-800 dark:text-sage-300 mt-3">
          Carregando painel perinatal...
        </Text>
      </View>
    );
  }

  const stats = data?.stats || {
    totalActive: 0,
    firstTrimester: 0,
    secondTrimester: 0,
    thirdTrimester: 0,
    redFlagsCount: 0,
  };

  const activeRedFlags = data?.activeRedFlags || [];

  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* 1. Header with Title & Availability Status Switcher */}
      <View className="flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-cream">
              Painel Perinatal
            </Text>
            <View className="px-2.5 py-0.5 rounded-full bg-sage-100 dark:bg-sage-900/40 border border-sage-300">
              <Text className="text-[11px] font-bold text-sage-800 dark:text-sage-200">
                Doula Helena
              </Text>
            </View>
          </View>
          <Text className="text-xs sm:text-sm text-sage-700 dark:text-sage-300 mt-1">
            Acompanhamento integral das suas gestantes em tempo real
          </Text>
        </View>

        {/* Doula Availability Controls */}
        <View className="flex-row items-center gap-1.5 bg-white dark:bg-dark-card p-1.5 rounded-2xl border border-cream-300 dark:border-dark-border shadow-sm self-start md:self-auto">
          {(
            [
              { key: 'ONLINE', label: 'Disponível', color: 'bg-emerald-500' },
              { key: 'IN_LABOR_SUPPORT', label: 'Em Parto', color: 'bg-amber-500' },
              { key: 'RESTING', label: 'Descanso', color: 'bg-purple-500' },
            ] as const
          ).map((item) => {
            const isSelected = currentStatus === item.key;
            return (
              <Pressable
                key={item.key}
                testID={`status-btn-${item.key.toLowerCase()}`}
                onPress={() => handleStatusChange(item.key)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-cream-300 dark:bg-dark-surface shadow-xs'
                    : 'opacity-70 active:opacity-100'
                }`}
              >
                <View className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <Text
                  className={`text-xs font-semibold ${
                    isSelected
                      ? 'text-gray-900 dark:text-white font-bold'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Priority Red Flags Banner (RN04) */}
      {activeRedFlags.length > 0 ? (
        <View className="mb-6 space-y-3">
          {activeRedFlags.map((alert) => (
            <View
              key={alert.logId}
              testID={`alert-card-${alert.logId}`}
              className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-3xl p-5 shadow-sm"
            >
              <View className="flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-9 h-9 rounded-2xl bg-rose-200 dark:bg-rose-900 items-center justify-center">
                    <AlertCircle size={20} color="#C25D3B" />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm sm:text-base font-bold text-terracotta-900 dark:text-rose-200">
                        Atenção Prioritária (Red Flag Obstétrica)
                      </Text>
                      <View className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900">
                        <Text className="text-[10px] font-bold text-terracotta-800 dark:text-rose-200">
                          Urgência
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-rose-800 dark:text-rose-300">
                      {alert.pregnantName} (Bebê {alert.babyNickname}) • {alert.gestationalWeek}s {alert.gestationalDays}d
                    </Text>
                  </View>
                </View>

                {/* Alert Actions */}
                <View className="flex-row items-center gap-2 self-end sm:self-auto">
                  <Pressable
                    testID={`ack-alert-btn-${alert.logId}`}
                    onPress={() => handleDismissRedFlag(alert.logId)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-rose-300 dark:border-rose-800 active:bg-rose-100"
                  >
                    <CheckCircle2 size={14} color="#6B8E78" />
                    <Text className="text-xs font-semibold text-gray-700 dark:text-cream">
                      Ciente
                    </Text>
                  </Pressable>

                  <Pressable
                    testID={`view-alert-client-btn-${alert.pregnancyId}`}
                    onPress={() => router.push(`/(doula)/client/${alert.pregnancyId}` as any)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-terracotta active:bg-terracotta-600 shadow-xs"
                  >
                    <Text className="text-xs font-bold text-white">Ver Prontuário</Text>
                    <ChevronRight size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              <View className="bg-white/80 dark:bg-dark-card/80 rounded-2xl p-3 border border-rose-200/60 dark:border-rose-900/60">
                <Text className="text-xs font-bold text-terracotta-900 dark:text-rose-200">
                  Motivo do Alerta:
                </Text>
                <Text className="text-xs text-gray-800 dark:text-rose-100 mt-0.5 leading-relaxed">
                  {alert.reason}
                </Text>
                <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mt-1.5">
                  Orientação: Entre em contato imediato para acolhimento e recomende avaliação médica presencial no pronto atendimento obstétrico.
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="mb-6 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 flex-row items-center gap-3">
          <ShieldCheck size={20} color="#059669" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Nenhum alerta crítico ativo no momento
            </Text>
            <Text className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
              Todas as gestantes monitoradas estão com parâmetros estáveis e confortáveis.
            </Text>
          </View>
        </View>
      )}

      {/* 3. Quick Stats Cards */}
      <View className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <View className="bg-white dark:bg-dark-card p-3.5 rounded-2xl border border-cream-300 dark:border-dark-border shadow-xs">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext">Total Gestantes</Text>
          <Text className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-cream mt-0.5">
            {stats.totalActive}
          </Text>
        </View>
        <View className="bg-white dark:bg-dark-card p-3.5 rounded-2xl border border-cream-300 dark:border-dark-border shadow-xs">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext">1º Trimestre</Text>
          <Text className="text-xl sm:text-2xl font-bold text-sage-800 dark:text-sage-300 mt-0.5">
            {stats.firstTrimester}
          </Text>
        </View>
        <View className="bg-white dark:bg-dark-card p-3.5 rounded-2xl border border-cream-300 dark:border-dark-border shadow-xs">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext">2º Trimestre</Text>
          <Text className="text-xl sm:text-2xl font-bold text-terracotta mt-0.5">
            {stats.secondTrimester}
          </Text>
        </View>
        <View className="bg-white dark:bg-dark-card p-3.5 rounded-2xl border border-cream-300 dark:border-dark-border shadow-xs">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext">3º Trimestre</Text>
          <Text className="text-xl sm:text-2xl font-bold text-terracotta-700 dark:text-terracotta-300 mt-0.5">
            {stats.thirdTrimester}
          </Text>
        </View>
      </View>

      {/* 4. Controls: Search, Filters & "Cadastrar Gestante" CTA */}
      <View className="flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
        {/* Search Bar */}
        <View className="flex-1 flex-row items-center bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl px-3 py-2">
          <Search size={16} color="#6B8E78" />
          <TextInput
            placeholder="Buscar por gestante ou bebê..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-xs sm:text-sm text-gray-800 dark:text-cream outline-none"
          />
        </View>

        {/* Filter Pills */}
        <View className="flex-row items-center gap-1.5 flex-wrap">
          {(
            [
              { key: 'ALL', label: 'Todas' },
              { key: 'T1', label: '1º Tri' },
              { key: 'T2', label: '2º Tri' },
              { key: 'T3', label: '3º Tri' },
              { key: 'ALERTS', label: 'Com Alerta' },
            ] as const
          ).map((filter) => {
            const isSelected = trimesterFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                testID={`filter-tab-${filter.key.toLowerCase()}`}
                onPress={() => setTrimesterFilter(filter.key)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-sage border-sage text-white'
                    : 'bg-white dark:bg-dark-card border-cream-300 dark:border-dark-border text-gray-600 dark:text-gray-300'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* New Anamnesis CTA */}
        <Pressable
          testID="btn-new-anamnesis"
          onPress={() => router.push('/(doula)/new-anamnesis')}
          className="bg-terracotta active:bg-terracotta-600 px-4 py-2.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm self-start lg:self-auto"
        >
          <UserPlus size={16} color="#FFFFFF" />
          <Text className="text-xs sm:text-sm font-bold text-white">Cadastrar Gestante</Text>
        </Pressable>
      </View>

      {/* 5. Responsive Grid of Client Cards */}
      {filteredClients.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {filteredClients.map((client) => {
            const cardWidth =
              numColumns === 3
                ? 'calc(33.333% - 11px)'
                : numColumns === 2
                ? 'calc(50% - 8px)'
                : '100%';

            const { gestationalAge } = client;
            const progress = Math.min(100, Math.max(0, gestationalAge.progressPercentage));

            return (
              <View
                key={client.pregnancyId}
                testID={`client-card-${client.pregnancyId}`}
                style={{ width: cardWidth as any }}
                className={`bg-white dark:bg-dark-card border rounded-3xl p-5 shadow-xs transition-all ${
                  client.hasRedFlag
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                    : 'border-cream-300 dark:border-dark-border'
                }`}
              >
                {/* Client Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-2xl bg-terracotta-100 dark:bg-terracotta-900/40 items-center justify-center">
                      <Text className="text-base font-bold text-terracotta">
                        {client.pregnantName.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-bold text-gray-800 dark:text-cream">
                        {client.pregnantName}
                      </Text>
                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        <BabyIcon size={12} color="#6B8E78" />
                        <Text className="text-xs text-sage font-medium">
                          Bebê {client.babyNickname}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Tag */}
                  {client.hasRedFlag ? (
                    <View className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/50 rounded-full border border-rose-300">
                      <Text className="text-[10px] font-bold text-terracotta-800 dark:text-rose-200">
                        Alerta Ativo
                      </Text>
                    </View>
                  ) : (
                    <View className="px-2 py-0.5 bg-sage-50 dark:bg-sage-950/40 rounded-full border border-sage-200">
                      <Text className="text-[10px] font-semibold text-sage-800 dark:text-sage-300">
                        {gestationalAge.trimester}º Tri
                      </Text>
                    </View>
                  )}
                </View>

                {/* Gestational Age Badge & Progress */}
                <View className="bg-cream dark:bg-dark-surface p-3.5 rounded-2xl mb-4 border border-cream-300/70 dark:border-dark-border">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-xs text-gray-500 dark:text-dark-subtext">Idade Gestacional</Text>
                    <View className="px-2 py-0.5 rounded-lg bg-terracotta/10">
                      <Text className="text-xs font-bold text-terracotta">
                        {gestationalAge.formattedShort}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                    {gestationalAge.formatted}
                  </Text>

                  {/* Pregnancy Progress Bar */}
                  <View className="mt-2.5">
                    <View className="flex-row justify-between text-[10px] text-gray-500 mb-1">
                      <Text className="text-[10px] text-gray-400">Progresso gestacional</Text>
                      <Text className="text-[10px] font-bold text-sage">{progress}%</Text>
                    </View>
                    <View className="w-full h-1.5 bg-cream-300 dark:bg-dark-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-sage rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                  </View>

                  {/* DPP & Days Remaining */}
                  <View className="flex-row justify-between items-center mt-3 pt-2.5 border-t border-cream-300 dark:border-dark-border">
                    <View className="flex-row items-center gap-1">
                      <Calendar size={12} color="#6B8E78" />
                      <Text className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                        DPP: {formatToIsoDateString(gestationalAge.dppDate)}
                      </Text>
                    </View>
                    <Text className="text-[11px] font-semibold text-terracotta">
                      {gestationalAge.daysRemaining} dias rest.
                    </Text>
                  </View>
                </View>

                {/* Action Button: Open Client Medical Record */}
                <Pressable
                  testID={`open-client-btn-${client.pregnancyId}`}
                  onPress={() => router.push(`/(doula)/client/${client.pregnancyId}` as any)}
                  className="w-full bg-cream-300 dark:bg-dark-surface hover:bg-sage-100 active:bg-sage-200 dark:hover:bg-dark-border py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5 transition-colors"
                >
                  <Text className="text-xs font-bold text-sage-800 dark:text-sage-200">
                    Abrir Prontuário 360º
                  </Text>
                  <ChevronRight size={14} color="#6B8E78" />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        /* Empty State */
        <View className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-cream-300 dark:border-dark-border items-center justify-center text-center my-6">
          <View className="w-16 h-16 rounded-full bg-sage-100 dark:bg-sage-900/30 items-center justify-center mb-3">
            <Search size={28} color="#6B8E78" />
          </View>
          <Text className="text-base font-bold text-gray-800 dark:text-cream">
            Nenhuma gestante encontrada
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1 max-w-sm text-center">
            {searchQuery
              ? `Não foram encontrados resultados para "${searchQuery}". Tente outro termo ou limpe a busca.`
              : 'Nenhuma gestante cadastrada neste filtro.'}
          </Text>
          {searchQuery && (
            <Pressable
              onPress={() => setSearchQuery('')}
              className="mt-3 px-3 py-1.5 rounded-xl bg-cream-300 dark:bg-dark-surface"
            >
              <Text className="text-xs font-semibold text-gray-700 dark:text-cream">
                Limpar Busca
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}
