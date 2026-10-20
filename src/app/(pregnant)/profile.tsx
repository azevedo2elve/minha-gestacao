import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, LogOut } from 'lucide-react-native';

export default function PregnantProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-2xl mx-auto w-full">
        <View className="items-center py-6">
          <View className="w-20 h-20 rounded-full bg-terracotta/20 items-center justify-center mb-3">
            <User size={36} color="#D97757" />
          </View>
          <Text className="text-xl font-bold text-gray-800 dark:text-cream">Maria Clara de Oliveira</Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300">Gestante • Doula: Helena Ramos</Text>
        </View>

        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border mb-4">
          <Text className="text-sm font-bold text-gray-800 dark:text-cream mb-2">Dados Obstétricos</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext">DPP Estimada: 08/10/2026</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mt-1">Maternidade: Hospital São Luiz</Text>
        </View>

        <Pressable
          onPress={() => router.replace('/')}
          className="bg-cream-300 dark:bg-dark-surface p-4 rounded-xl flex-row items-center justify-center gap-2"
        >
          <LogOut size={16} color="#C25D3B" />
          <Text className="text-terracotta-700 font-bold text-xs">Voltar ao Menu Principal</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
