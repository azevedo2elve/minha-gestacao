import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import {
  formatToIsoDateString,
  normalizeToUtcDate,
  addDays,
  diffInDays,
  getGestationalAge,
} from '@/lib/obstetrics';

interface DateSelectorProps {
  selectedDate: string; // ISO string 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
  effectiveDum?: string;
  containerClassName?: string;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  effectiveDum,
  containerClassName = '',
}: DateSelectorProps) {
  const todayIso = formatToIsoDateString(new Date());
  const isToday = selectedDate === todayIso;
  const isFuture = diffInDays(selectedDate, todayIso) > 0;

  // Days difference from today (negative for past)
  const daysDiff = diffInDays(selectedDate, todayIso);

  const formatFriendlyDate = (isoStr: string) => {
    if (isoStr === todayIso) return 'Hoje';
    const yesterday = formatToIsoDateString(addDays(todayIso, -1));
    if (isoStr === yesterday) return 'Ontem';

    const d = normalizeToUtcDate(isoStr);
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
    return `${day} de ${months[d.getUTCMonth()]}`;
  };

  const handlePrevDay = () => {
    const prevDate = formatToIsoDateString(addDays(selectedDate, -1));
    onSelectDate(prevDate);
  };

  const handleNextDay = () => {
    if (isToday || isFuture) return;
    const nextDate = formatToIsoDateString(addDays(selectedDate, 1));
    onSelectDate(nextDate);
  };

  const gaAtDate = effectiveDum ? getGestationalAge(effectiveDum, selectedDate) : null;

  const yesterdayIso = formatToIsoDateString(addDays(todayIso, -1));
  const dayBeforeYesterdayIso = formatToIsoDateString(addDays(todayIso, -2));

  return (
    <View className={`bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-3xl p-4 shadow-2xs mb-5 ${containerClassName}`}>
      {/* Date Navigation Bar */}
      <View className="flex-row items-center justify-between">
        <Pressable
          testID="btn-prev-day"
          onPress={handlePrevDay}
          className="w-10 h-10 rounded-2xl bg-cream dark:bg-dark-surface items-center justify-center border border-cream-400 dark:border-dark-border active:bg-cream-300"
        >
          <ChevronLeft size={20} color="#6B8E78" />
        </Pressable>

        <View className="items-center flex-1 px-2">
          <View className="flex-row items-center gap-1.5">
            <CalendarIcon size={14} color="#D97757" />
            <Text className="text-base font-bold text-gray-800 dark:text-cream">
              {formatFriendlyDate(selectedDate)}
            </Text>
            {isToday && (
              <View className="px-2 py-0.5 rounded-full bg-terracotta/15 border border-terracotta/30">
                <Text className="text-[10px] font-bold text-terracotta">Hoje</Text>
              </View>
            )}
          </View>
          <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mt-0.5">
            {selectedDate}
          </Text>
        </View>

        <Pressable
          testID="btn-next-day"
          disabled={isToday}
          onPress={handleNextDay}
          className={`w-10 h-10 rounded-2xl items-center justify-center border ${
            isToday
              ? 'bg-gray-100 dark:bg-dark-surface/40 border-gray-200 dark:border-dark-border/40 opacity-40'
              : 'bg-cream dark:bg-dark-surface border-cream-400 dark:border-dark-border active:bg-cream-300'
          }`}
        >
          <ChevronRight size={20} color={isToday ? '#A0AEC0' : '#6B8E78'} />
        </Pressable>
      </View>

      {/* Gestational Age on that Date */}
      {gaAtDate && (
        <View className="mt-3 pt-3 border-t border-cream-200 dark:border-dark-border flex-row items-center justify-between">
          <Text className="text-xs text-gray-500 dark:text-dark-subtext">
            Idade Gestacional nesta data:
          </Text>
          <View className="px-2.5 py-0.5 rounded-lg bg-sage/15 border border-sage/30">
            <Text className="text-xs font-bold text-sage-800 dark:text-sage-300">
              {gaAtDate.formatted}
            </Text>
          </View>
        </View>
      )}

      {/* Quick Selection Chips */}
      <View className="flex-row gap-2 mt-3 justify-center">
        <Pressable
          testID="quick-date-today"
          onPress={() => onSelectDate(todayIso)}
          className={`px-3 py-1 rounded-xl border text-xs ${
            selectedDate === todayIso
              ? 'bg-sage border-sage'
              : 'bg-cream-100 dark:bg-dark-surface border-cream-300 dark:border-dark-border'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              selectedDate === todayIso ? 'text-white' : 'text-gray-700 dark:text-dark-text'
            }`}
          >
            Hoje
          </Text>
        </Pressable>

        <Pressable
          testID="quick-date-yesterday"
          onPress={() => onSelectDate(yesterdayIso)}
          className={`px-3 py-1 rounded-xl border text-xs ${
            selectedDate === yesterdayIso
              ? 'bg-sage border-sage'
              : 'bg-cream-100 dark:bg-dark-surface border-cream-300 dark:border-dark-border'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              selectedDate === yesterdayIso ? 'text-white' : 'text-gray-700 dark:text-dark-text'
            }`}
          >
            Ontem
          </Text>
        </Pressable>

        <Pressable
          testID="quick-date-before"
          onPress={() => onSelectDate(dayBeforeYesterdayIso)}
          className={`px-3 py-1 rounded-xl border text-xs ${
            selectedDate === dayBeforeYesterdayIso
              ? 'bg-sage border-sage'
              : 'bg-cream-100 dark:bg-dark-surface border-cream-300 dark:border-dark-border'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              selectedDate === dayBeforeYesterdayIso
                ? 'text-white'
                : 'text-gray-700 dark:text-dark-text'
            }`}
          >
            Anteontem
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
