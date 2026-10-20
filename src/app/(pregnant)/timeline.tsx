import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity } from 'lucide-react-native';

export default function PregnantTimelineScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-2xl mx-auto w-full">
        <View className="items-center py-8">
          <View className="w-16 h-16 rounded-2xl bg-sage/20 items-center justify-center mb-4">
            <Activity size={32} color="#6B8E78" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Evolução Gestacional</Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext text-center mt-1 max-w-sm">
            Linha do tempo de 40 semanas, marcos dos trimestres e curvas de peso materno e fetal.
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border">
          <Text className="text-sm font-semibold text-sage-700">Feature 05: Barra de Nível 40 Semanas</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mt-1 leading-relaxed">
            Layout estruturado para renderização dos gráficos com interpolação de pesagens não diárias.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
