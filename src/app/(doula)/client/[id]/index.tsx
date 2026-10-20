import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User, Activity, Calendar, FileText } from 'lucide-react-native';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <Pressable
        onPress={() => router.push('/(doula)/dashboard')}
        className="flex-row items-center gap-1.5 mb-6"
      >
        <ArrowLeft size={16} color="#6B8E78" />
        <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">Voltar ao Painel</Text>
      </Pressable>

      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-6 mb-6">
        <View className="flex-row items-center gap-4 mb-4">
          <View className="w-16 h-16 rounded-full bg-terracotta/20 items-center justify-center">
            <User size={30} color="#D97757" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-800 dark:text-cream">Prontuário 360º da Gestante</Text>
            <Text className="text-xs text-sage font-medium">Cliente ID: {id}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mt-4 flex-wrap">
          <Pressable
            onPress={() => router.push(`/(doula)/client/${id}/schedule` as any)}
            className="bg-cream dark:bg-dark-surface px-4 py-2 rounded-xl flex-row items-center gap-2"
          >
            <Calendar size={14} color="#6B8E78" />
            <Text className="text-xs font-semibold text-sage-800 dark:text-cream">Prescrições & Agenda</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push(`/(doula)/client/${id}/anamnesis-edit` as any)}
            className="bg-cream dark:bg-dark-surface px-4 py-2 rounded-xl flex-row items-center gap-2"
          >
            <FileText size={14} color="#D97757" />
            <Text className="text-xs font-semibold text-terracotta-800 dark:text-cream">Editar Anamnese</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
