import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';

export default function PregnantCalendarScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-2xl mx-auto w-full">
        <View className="items-center py-8">
          <View className="w-16 h-16 rounded-2xl bg-rose-200 dark:bg-rose-900/30 items-center justify-center mb-4">
            <Calendar size={32} color="#DC969C" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Agenda e Prescrições</Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext text-center mt-1 max-w-sm">
            Consultas com a doula, exames médicos, videochamadas e plano diário de exercícios.
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border">
          <Text className="text-sm font-semibold text-rose-600">Feature 06: Calendário & Videochamada</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mt-1 leading-relaxed">
            Layout preparado para checklist diário e integração direta de videochamadas seguras.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
