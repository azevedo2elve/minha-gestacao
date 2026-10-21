import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Calendar,
  BookOpen,
  HeartHandshake,
  CheckCircle2,
  Circle,
  Video,
  Sparkles,
  ChevronRight,
  Heart,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePregnantHome } from '@/hooks/useDashboard';
import { getBabySizeIllustration } from '@/lib/gestational-metadata';

export default function PregnantHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { profile, logout } = useAuthStore();

  const { data, isLoading, toggleTask, isTogglingTask } = usePregnantHome(profile);
  const [showFullDevelopment, setShowFullDevelopment] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (isLoading && !data) {
    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg items-center justify-center p-6">
        <ActivityIndicator size="large" color="#D97757" />
        <Text className="text-sm font-semibold text-terracotta mt-3">
          Preparando seu cantinho de gestação...
        </Text>
      </SafeAreaView>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Maria';
  const babyNickname = data?.baby?.nickname || 'Bebê';
  const gestationalAge = data?.gestationalAge;
  const weekMetadata = data?.weekMetadata;
  const doula = data?.doula;
  const todayTasks = data?.todayTasks || [];
  const upcomingEvents = data?.upcomingEvents || [];
  const isTodayLogCompleted = data?.isTodayLogCompleted || false;

  const completedTasksCount = todayTasks.filter((t) => t.is_completed).length;
  const totalTasksCount = todayTasks.length;

  const illustrationEmoji = weekMetadata
    ? getBabySizeIllustration(weekMetadata.illustration_key)
    : '🌽';

  const progressPercentage = gestationalAge
    ? Math.min(100, Math.max(0, gestationalAge.progressPercentage))
    : 60;

  // Doula Availability badge configuration
  const doulaStatus = doula?.doula_status || 'ONLINE';
  const doulaStatusConfig = {
    ONLINE: {
      label: 'Disponível',
      subtext: 'Pronta para te acolher e tirar dúvidas',
      dotColor: 'bg-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      textColor: 'text-emerald-800 dark:text-emerald-300',
    },
    IN_LABOR_SUPPORT: {
      label: 'Em Apoio a Parto',
      subtext: 'Acompanhando um nascimento. Emergências ligue no celular',
      dotColor: 'bg-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-900',
      textColor: 'text-amber-800 dark:text-amber-300',
    },
    RESTING: {
      label: 'Em Descanso',
      subtext: 'Horário de repouso programado. Mensagens serão respondidas em breve',
      dotColor: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: 'border-purple-200 dark:border-purple-900',
      textColor: 'text-purple-800 dark:text-purple-300',
    },
  }[doulaStatus];

  const handleToggleTask = async (itemId: string, currentStatus: boolean) => {
    if (isTogglingTask) return;
    await toggleTask({ itemId, newStatus: !currentStatus });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {/* 1. Top Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Pressable
            testID="btn-logout"
            onPress={handleLogout}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-300 dark:bg-dark-card active:bg-rose-100"
          >
            <LogOut size={14} color="#C25D3B" />
            <Text className="text-xs font-semibold text-terracotta-700 dark:text-terracotta-300">
              Sair
            </Text>
          </Pressable>

          <View className="px-3.5 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-full border border-rose-300">
            <Text className="text-xs font-semibold text-rose-600 dark:text-rose-300">
              Espaço da Gestante
            </Text>
          </View>
        </View>

        {/* 2. Doula Availability Banner Card */}
        {doula && (
          <Pressable
            testID="banner-doula-status"
            onPress={() => router.push('/(pregnant)/chat')}
            className={`flex-row items-center justify-between p-3.5 rounded-2xl border mb-5 shadow-2xs ${doulaStatusConfig.bgColor} ${doulaStatusConfig.borderColor}`}
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-9 h-9 rounded-full bg-white dark:bg-dark-card items-center justify-center shadow-xs">
                <HeartHandshake size={18} color="#6B8E78" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <View className={`w-2 h-2 rounded-full ${doulaStatusConfig.dotColor}`} />
                  <Text className={`text-xs font-bold ${doulaStatusConfig.textColor}`}>
                    {doula.full_name}: {doulaStatusConfig.label}
                  </Text>
                </View>
                <Text className="text-[11px] text-gray-600 dark:text-dark-subtext mt-0.5" numberOfLines={1}>
                  {doulaStatusConfig.subtext}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#6B8E78" />
          </Pressable>
        )}

        {/* 3. Greeting Section */}
        <View className="mb-5">
          <Text className="text-sm font-semibold text-sage-700 dark:text-sage-400">
            Olá, {firstName} & {babyNickname} ✨
          </Text>
          <Text className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-cream mt-0.5">
            {gestationalAge
              ? `${gestationalAge.weeks} semanas e ${gestationalAge.days} dias de amor`
              : 'Sua jornada da gestação'}
          </Text>
          {weekMetadata && (
            <Text className="text-xs sm:text-sm text-gray-600 dark:text-dark-subtext mt-1.5 leading-relaxed">
              Seu bebê tem o tamanho aproximado de uma{' '}
              <Text className="font-bold text-terracotta">
                {weekMetadata.baby_size_comparison} {illustrationEmoji}
              </Text>
            </Text>
          )}
        </View>

        {/* 4. Baby Evolution Card (Hero with metadata) */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-6 mb-6 shadow-sm border border-cream-300 dark:border-dark-border">
          {/* Main Visual & Week Info */}
          <View className="items-center py-2">
            <View className="w-24 h-24 rounded-3xl bg-terracotta-100/70 dark:bg-terracotta-900/40 items-center justify-center mb-3 shadow-inner">
              <Text className="text-5xl">{illustrationEmoji}</Text>
            </View>
            <Text className="text-2xl font-bold text-terracotta">
              Semana {gestationalAge?.weeks || 24}
            </Text>
            <Text className="text-xs text-sage-800 dark:text-sage-300 font-semibold mt-1">
              {gestationalAge?.trimester}º Trimestre • {gestationalAge?.daysRemaining} dias restantes para a DPP
            </Text>

            {/* Average Length & Weight Badges */}
            {weekMetadata && (weekMetadata.avg_length_cm || weekMetadata.avg_weight_g) && (
              <View className="flex-row items-center gap-2 mt-3">
                {weekMetadata.avg_length_cm != null && (
                  <View className="px-3 py-1 rounded-full bg-cream dark:bg-dark-surface border border-cream-300 dark:border-dark-border">
                    <Text className="text-[11px] font-semibold text-gray-700 dark:text-cream">
                      📏 ~{weekMetadata.avg_length_cm} cm
                    </Text>
                  </View>
                )}
                {weekMetadata.avg_weight_g != null && (
                  <View className="px-3 py-1 rounded-full bg-cream dark:bg-dark-surface border border-cream-300 dark:border-dark-border">
                    <Text className="text-[11px] font-semibold text-gray-700 dark:text-cream">
                      ⚖️ ~{weekMetadata.avg_weight_g} g
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Gestational Progress Bar */}
          <View className="mt-4 pt-3 border-t border-cream-300 dark:border-dark-border">
            <View className="flex-row justify-between text-xs mb-1.5">
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">Progresso da Gestação</Text>
              <Text className="text-[11px] font-bold text-sage">{progressPercentage}%</Text>
            </View>
            <View className="w-full h-2 bg-cream-300 dark:bg-dark-border rounded-full overflow-hidden">
              <View
                className="h-full bg-sage rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
          </View>

          {/* Development Summary Details */}
          {weekMetadata && (
            <View className="mt-4 space-y-3">
              <View className="bg-cream dark:bg-dark-surface rounded-2xl p-4 border border-cream-300/70 dark:border-dark-border">
                <Text className="text-xs font-bold text-sage-900 dark:text-cream mb-1">
                  🌱 Desenvolvimento do Bebê nesta semana:
                </Text>
                <Text className="text-xs text-gray-700 dark:text-dark-subtext leading-relaxed">
                  {weekMetadata.baby_development_summary}
                </Text>

                {showFullDevelopment && (
                  <View className="mt-3 pt-3 border-t border-cream-300/80 dark:border-dark-border">
                    <Text className="text-xs font-bold text-sage-900 dark:text-cream mb-1">
                      🌸 O que seu corpo pode estar sentindo:
                    </Text>
                    <Text className="text-xs text-gray-700 dark:text-dark-subtext leading-relaxed">
                      {weekMetadata.mother_body_changes}
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => setShowFullDevelopment(!showFullDevelopment)}
                  className="mt-2 self-start py-0.5"
                >
                  <Text className="text-[11px] font-bold text-sage">
                    {showFullDevelopment ? 'Ver menos' : 'Saiba mais sobre seu corpo nesta semana →'}
                  </Text>
                </Pressable>
              </View>

              {/* Doula tip of the week */}
              <View className="bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-200/80 dark:border-rose-900/40">
                <Text className="text-xs font-bold text-terracotta-900 dark:text-rose-200 mb-1">
                  💌 Dica carinhosa da sua Doula:
                </Text>
                <Text className="text-xs text-gray-700 dark:text-rose-100 leading-relaxed">
                  {weekMetadata.doula_tip_of_week}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 5. Quick Actions (Responsive Grid) */}
        <View className={`gap-3 ${isTablet ? 'flex-row' : 'flex-col'} mb-6`}>
          {/* Daily Diary CTA Button */}
          <Pressable
            testID="btn-diary-cta"
            onPress={() => router.push('/(pregnant)/diary')}
            className={`flex-1 p-4 rounded-3xl shadow-sm flex-row items-center gap-3 transition-colors ${
              isTodayLogCompleted
                ? 'bg-sage active:bg-sage-600'
                : 'bg-terracotta active:bg-terracotta-600'
            }`}
          >
            <View className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center">
              <BookOpen size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-white font-bold text-sm">
                  {isTodayLogCompleted ? 'Diário de Hoje Preenchido' : 'Preencher Diário de Hoje'}
                </Text>
                {isTodayLogCompleted && (
                  <View className="w-4 h-4 rounded-full bg-white items-center justify-center">
                    <CheckCircle2 size={12} color="#6B8E78" />
                  </View>
                )}
              </View>
              <Text className="text-white/80 text-xs mt-0.5">
                {isTodayLogCompleted
                  ? 'Toque para rever ou editar seus sintomas'
                  : 'Sintomas, emoções e movimentos fetais'}
              </Text>
            </View>
            <ChevronRight size={18} color="#FFFFFF" />
          </Pressable>

          {/* Talk to Doula CTA Button */}
          <Pressable
            testID="btn-chat-doula"
            onPress={() => router.push('/(pregnant)/chat')}
            className="flex-1 bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border active:bg-cream p-4 rounded-3xl shadow-xs flex-row items-center gap-3"
          >
            <View className="w-11 h-11 rounded-2xl bg-sage-100 dark:bg-sage-900/40 items-center justify-center">
              <HeartHandshake size={22} color="#6B8E78" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 dark:text-cream font-bold text-sm">
                Falar com a Doula
              </Text>
              <Text className="text-sage-700 dark:text-sage-300 text-xs mt-0.5">
                Envie áudio, foto de exame ou tire dúvidas
              </Text>
            </View>
            <ChevronRight size={18} color="#6B8E78" />
          </Pressable>
        </View>

        {/* 6. Today's Events / Video Calls */}
        {upcomingEvents.length > 0 && (
          <View className="mb-6 space-y-3">
            {upcomingEvents.map((event) => (
              <View
                key={event.id}
                testID={`event-card-${event.id}`}
                className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-3xl p-4 shadow-xs"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-purple-200 dark:bg-purple-900/50 items-center justify-center">
                      <Video size={16} color="#7C3AED" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        {event.title}
                      </Text>
                      {event.start_time && (
                        <Text className="text-[11px] text-purple-700 dark:text-purple-300">
                          Horário: {event.start_time.slice(0, 5)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {event.video_room_url && (
                    <Pressable
                      testID="btn-join-videocall"
                      onPress={() => router.push('/(pregnant)/calendar')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 active:bg-purple-700 flex-row items-center gap-1.5"
                    >
                      <Text className="text-xs font-bold text-white">Entrar na Sala</Text>
                      <ExternalLink size={12} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
                {event.description && (
                  <Text className="text-xs text-gray-700 dark:text-purple-200 mt-1">
                    {event.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 7. Daily Tasks / Checklist */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-cream-300 dark:border-dark-border shadow-xs">
          <View className="flex-row items-center justify-between mb-3.5">
            <View className="flex-row items-center gap-2">
              <Calendar size={18} color="#6B8E78" />
              <Text className="text-sm font-bold text-gray-800 dark:text-cream">
                Tarefas & Cuidados de Hoje
              </Text>
            </View>

            <View className="px-2.5 py-0.5 rounded-full bg-cream-300 dark:bg-dark-surface">
              <Text className="text-[11px] font-bold text-sage-800 dark:text-sage-300">
                {completedTasksCount} de {totalTasksCount} concluídas
              </Text>
            </View>
          </View>

          {todayTasks.length > 0 ? (
            <View className="space-y-2.5">
              {todayTasks.map((task) => (
                <Pressable
                  key={task.id}
                  testID={`task-item-${task.id}`}
                  onPress={() => handleToggleTask(task.id, task.is_completed)}
                  className={`flex-row items-start gap-3 p-3 rounded-2xl border transition-all ${
                    task.is_completed
                      ? 'bg-cream-200/50 dark:bg-dark-surface/50 border-cream-300 dark:border-dark-border opacity-70'
                      : 'bg-cream dark:bg-dark-surface border-cream-300 dark:border-dark-border'
                  }`}
                >
                  <View className="mt-0.5">
                    {task.is_completed ? (
                      <CheckCircle2 size={18} color="#6B8E78" />
                    ) : (
                      <Circle size={18} color="#9CA3AF" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-xs font-semibold ${
                        task.is_completed
                          ? 'line-through text-gray-500 dark:text-dark-subtext'
                          : 'text-gray-800 dark:text-cream'
                      }`}
                    >
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text
                        className={`text-[11px] mt-0.5 ${
                          task.is_completed
                            ? 'text-gray-400 dark:text-dark-subtext'
                            : 'text-gray-500 dark:text-dark-subtext'
                        }`}
                      >
                        {task.description}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="py-6 items-center justify-center text-center">
              <Sparkles size={24} color="#6B8E78" />
              <Text className="text-xs font-semibold text-gray-700 dark:text-cream mt-2">
                Nenhuma tarefa pendente para hoje!
              </Text>
              <Text className="text-[11px] text-gray-500 dark:text-dark-subtext text-center mt-0.5">
                Aproveite o momento para descansar, respirar e se conectar com seu bebê.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
