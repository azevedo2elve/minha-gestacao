import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGestationalAge, calculateDpp, formatToIsoDateString } from '@/lib/obstetrics';

export default function IndexScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  // Live test preview of obstetrics engine
  const [sampleDum] = useState('2026-04-10');
  const preview = getGestationalAge(sampleDum, new Date());

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="w-16 h-16 rounded-full bg-terracotta/20 items-center justify-center mb-3">
            <Text className="text-2xl">🌱</Text>
          </View>
          <Text className="text-3xl font-bold text-terracotta text-center">Minha Gestação</Text>
          <Text className="text-base text-sage-700 dark:text-sage-300 text-center mt-1">
            Acompanhamento Perinatal Humanizado
          </Text>
          <View className="mt-2 px-3 py-1 bg-sage/10 rounded-full border border-sage/20">
            <Text className="text-xs text-sage font-medium">
              Ambiente: {isTabletOrDesktop ? `Tablet/Web (${width}px)` : `Mobile (${width}px)`}
            </Text>
          </View>
        </View>

        {/* Feature 00 Verification Card: Obstetrics Engine */}
        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 mb-6 shadow-sm border border-cream-300 dark:border-dark-border">
          <Text className="text-lg font-bold text-sage-800 dark:text-cream mb-2">
            Motor de Cálculo Obstétrico (RN01)
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mb-3">
            Demonstração com DUM de referência: {sampleDum}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl flex-1 min-w-[130px]">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">Idade Gestacional</Text>
              <Text className="text-base font-bold text-terracotta">{preview.formatted}</Text>
              <Text className="text-xs text-terracotta-600 font-semibold">{preview.formattedShort}</Text>
            </View>

            <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl flex-1 min-w-[130px]">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">Data Provável (DPP)</Text>
              <Text className="text-base font-bold text-sage">{formatToIsoDateString(preview.dppDate)}</Text>
              <Text className="text-xs text-sage-600">Restam {preview.daysRemaining} dias</Text>
            </View>

            <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl flex-1 min-w-[130px]">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">Trimestre & Progresso</Text>
              <Text className="text-base font-bold text-gray-800 dark:text-white">{preview.trimester}º Trimestre</Text>
              <Text className="text-xs text-gray-600 dark:text-dark-subtext">{preview.progressPercentage}% concluído</Text>
            </View>
          </View>
        </View>

        {/* Navigation to Viewports */}
        <Text className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-1">
          Navegação de Demonstração (Feature 00)
        </Text>

        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/(pregnant)/home')}
            className="bg-terracotta active:bg-terracotta-600 p-4 rounded-xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-bold text-base">Visão da Gestante (PREGNANT)</Text>
              <Text className="text-terracotta-100 text-xs mt-0.5">
                Layout mobile-first com abas inferiores e cards humanizados
              </Text>
            </View>
            <Text className="text-white text-lg font-bold">→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doula)/dashboard')}
            className="bg-sage active:bg-sage-600 p-4 rounded-xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white font-bold text-base">Visão da Doula (DOULA)</Text>
              <Text className="text-sage-100 text-xs mt-0.5">
                Layout responsivo (Sidebar em Tablet/Web & Grid adaptativo)
              </Text>
            </View>
            <Text className="text-white text-lg font-bold">→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border p-4 rounded-xl flex-row items-center justify-between"
          >
            <View>
              <Text className="text-gray-800 dark:text-cream font-bold text-base">Autenticação (Login Único)</Text>
              <Text className="text-gray-500 dark:text-dark-subtext text-xs mt-0.5">
                Portal de entrada para Doulas e Gestantes cadastradas
              </Text>
            </View>
            <Text className="text-gray-400 text-lg font-bold">→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
