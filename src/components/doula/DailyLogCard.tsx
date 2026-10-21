import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Baby,
  Activity,
  Heart,
  Droplets,
  Moon,
  Scale,
  MessageCircle,
} from 'lucide-react-native';
import { DailyLog } from '@/types/database';
import {
  formatGestationalAge,
  formatGestationalAgeShort,
  normalizeToUtcDate,
} from '@/lib/obstetrics';
import {
  getMoodLabel,
  getSymptomLabel,
  getFetalMovementLabel,
  ALL_SYMPTOM_OPTIONS,
} from '@/constants/diary';

interface DailyLogCardProps {
  log: DailyLog;
  pregnantName: string;
  pregnantPhone?: string | null;
  onMarkSeen?: (logId: string) => void;
  isMarkingSeen?: boolean;
}

export function DailyLogCard({
  log,
  pregnantName,
  pregnantPhone,
  onMarkSeen,
  isMarkingSeen,
}: DailyLogCardProps) {
  const isRedFlag = log.has_red_flag;
  const isSeen = Boolean(log.seen_by_doula_at);

  const formatDate = (dateStr: string) => {
    const d = normalizeToUtcDate(dateStr);
    const day = d.getUTCDate();
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    return `${day} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  };

  const criticalSymptoms = (log.symptom_tags || []).filter((tag) => {
    const found = ALL_SYMPTOM_OPTIONS.find((s) => s.value === tag);
    return found?.isRedFlag;
  });

  const handleOpenWhatsApp = () => {
    const cleanPhone = pregnantPhone ? pregnantPhone.replace(/\D/g, '') : '';
    const dateFormatted = formatDate(log.log_date);
    const msg = encodeURIComponent(
      `Olá ${pregnantName}! Vi seu registro de diário do dia ${dateFormatted} e gostaria de conversar com você sobre como está se sentindo.`
    );
    const url = cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View
      testID={`log-card-${log.id}`}
      className={`rounded-3xl p-5 mb-4 border transition-all ${
        isRedFlag
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
          : 'bg-white dark:bg-dark-card border-cream-300 dark:border-dark-border shadow-xs'
      }`}
    >
      {/* Top Header */}
      <View className="flex-row items-center justify-between mb-3 flex-wrap gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-terracotta/10 items-center justify-center">
            <Calendar size={16} color="#D97757" />
          </View>
          <View>
            <Text className="text-sm font-bold text-gray-800 dark:text-cream">
              {formatDate(log.log_date)}
            </Text>
            <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
              {formatGestationalAge(log.gestational_week_at_log, log.gestational_days_at_log)} (
              {formatGestationalAgeShort(
                log.gestational_week_at_log,
                log.gestational_days_at_log
              )}
              )
            </Text>
          </View>
        </View>

        {/* Status Badges */}
        <View className="flex-row items-center gap-1.5">
          {isRedFlag && (
            <View className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/60 rounded-full border border-rose-300 flex-row items-center gap-1">
              <AlertTriangle size={12} color="#E05252" />
              <Text className="text-[10px] font-bold text-rose-800 dark:text-rose-200">
                Alerta Obstétrico
              </Text>
            </View>
          )}

          {isSeen ? (
            <View className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200 flex-row items-center gap-1">
              <CheckCircle2 size={11} color="#059669" />
              <Text className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                Visto
              </Text>
            </View>
          ) : (
            isRedFlag &&
            onMarkSeen && (
              <Pressable
                testID={`mark-seen-btn-${log.id}`}
                disabled={isMarkingSeen}
                onPress={() => onMarkSeen(log.id)}
                className="px-2.5 py-1 bg-white dark:bg-dark-surface rounded-xl border border-rose-300 dark:border-rose-800 flex-row items-center gap-1 active:bg-rose-50"
              >
                <CheckCircle2 size={12} color="#6B8E78" />
                <Text className="text-[10px] font-bold text-gray-700 dark:text-cream">
                  Dar Ciência
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {/* Red Flag Warning Box */}
      {isRedFlag && (
        <View className="bg-rose-100/70 dark:bg-rose-950/40 rounded-2xl p-3 border border-rose-300/80 dark:border-rose-900/60 mb-3.5">
          <Text className="text-xs font-bold text-rose-900 dark:text-rose-200">
            Atenção Prioritária (RN04):
          </Text>
          {criticalSymptoms.length > 0 && (
            <Text className="text-xs text-rose-800 dark:text-rose-100 mt-0.5">
              Sintomas críticos:{' '}
              {criticalSymptoms.map((c) => getSymptomLabel(c)).join(', ')}
            </Text>
          )}
          {log.fetal_movement === 'DECREASED' && log.gestational_week_at_log >= 28 && (
            <Text className="text-xs text-rose-800 dark:text-rose-100 mt-0.5">
              Movimentação fetal diminuída na {log.gestational_week_at_log}ª semana
            </Text>
          )}
        </View>
      )}

      {/* Mood Tags */}
      {log.mood_tags && log.mood_tags.length > 0 && (
        <View className="mb-3">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext mb-1.5">
            Sentimentos & Emoções:
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {log.mood_tags.map((tag) => (
              <View
                key={tag}
                className="px-2.5 py-1 bg-cream-200 dark:bg-dark-surface rounded-xl border border-cream-300 dark:border-dark-border"
              >
                <Text className="text-xs text-gray-700 dark:text-cream font-medium">
                  {getMoodLabel(tag)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Symptom Tags */}
      {log.symptom_tags && log.symptom_tags.length > 0 && (
        <View className="mb-3">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext mb-1.5">
            Sintomas Físicos:
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {log.symptom_tags.map((tag) => {
              const isCrit = ALL_SYMPTOM_OPTIONS.find((s) => s.value === tag)?.isRedFlag;
              return (
                <View
                  key={tag}
                  className={`px-2.5 py-1 rounded-xl border ${
                    isCrit
                      ? 'bg-rose-500 border-rose-600'
                      : 'bg-white dark:bg-dark-surface border-cream-400 dark:border-dark-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isCrit ? 'text-white font-bold' : 'text-gray-700 dark:text-cream'
                    }`}
                  >
                    {getSymptomLabel(tag)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Health Metrics Grid (Fetal Movement, Sleep, Hydration) */}
      <View className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 mb-3 bg-cream-100/70 dark:bg-dark-surface/50 rounded-2xl p-3 border border-cream-200 dark:border-dark-border">
        {/* Fetal movement */}
        <View>
          <View className="flex-row items-center gap-1 mb-0.5">
            <Baby size={12} color="#D97757" />
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Movimento Fetal</Text>
          </View>
          <Text className="text-xs font-bold text-gray-800 dark:text-cream">
            {getFetalMovementLabel(log.fetal_movement)}
          </Text>
        </View>

        {/* Sleep quality */}
        <View>
          <View className="flex-row items-center gap-1 mb-0.5">
            <Moon size={12} color="#6366F1" />
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Sono (1-5)</Text>
          </View>
          <Text className="text-xs font-bold text-gray-800 dark:text-cream">
            {log.sleep_quality ? `${log.sleep_quality}/5` : 'Não informado'}
          </Text>
        </View>

        {/* Hydration */}
        <View>
          <View className="flex-row items-center gap-1 mb-0.5">
            <Droplets size={12} color="#0EA5E9" />
            <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">Hidratação (1-5)</Text>
          </View>
          <Text className="text-xs font-bold text-gray-800 dark:text-cream">
            {log.hydration_level ? `${log.hydration_level}/5` : 'Não informado'}
          </Text>
        </View>
      </View>

      {/* Optional Biometrics (Weight, Blood Pressure) */}
      {(log.mother_weight_kg || log.baby_estimated_weight_g || log.blood_pressure) && (
        <View className="flex-row gap-3 py-2 px-3 mb-3 bg-white dark:bg-dark-surface rounded-2xl border border-cream-300 dark:border-dark-border flex-wrap">
          {log.mother_weight_kg && (
            <View className="flex-row items-center gap-1.5">
              <Scale size={13} color="#6B8E78" />
              <Text className="text-xs text-gray-600 dark:text-dark-subtext">
                Peso Mãe: <Text className="font-bold text-gray-800 dark:text-cream">{log.mother_weight_kg} kg</Text>
              </Text>
            </View>
          )}

          {log.baby_estimated_weight_g && (
            <View className="flex-row items-center gap-1.5">
              <Baby size={13} color="#D97757" />
              <Text className="text-xs text-gray-600 dark:text-dark-subtext">
                Peso Bebê: <Text className="font-bold text-gray-800 dark:text-cream">{log.baby_estimated_weight_g} g</Text>
              </Text>
            </View>
          )}

          {log.blood_pressure && (
            <View className="flex-row items-center gap-1.5">
              <Activity size={13} color="#E05252" />
              <Text className="text-xs text-gray-600 dark:text-dark-subtext">
                PA: <Text className="font-bold text-gray-800 dark:text-cream">{log.blood_pressure}</Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {log.notes && (
        <View className="bg-cream-100/50 dark:bg-dark-surface/40 p-3 rounded-2xl border border-cream-200 dark:border-dark-border mb-3">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext mb-0.5">
            Anotações da Gestante:
          </Text>
          <Text className="text-xs text-gray-700 dark:text-dark-text italic leading-relaxed">
            "{log.notes}"
          </Text>
        </View>
      )}

      {/* Card Action footer */}
      <View className="flex-row justify-end items-center gap-2 pt-2 border-t border-cream-200 dark:border-dark-border">
        <Pressable
          testID={`whatsapp-discuss-btn-${log.id}`}
          onPress={handleOpenWhatsApp}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-200 active:bg-sage-100"
        >
          <MessageCircle size={13} color="#6B8E78" />
          <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">
            Conversar no WhatsApp
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
