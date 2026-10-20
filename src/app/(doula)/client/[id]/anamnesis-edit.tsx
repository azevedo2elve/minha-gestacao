import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';

export default function ClientAnamnesisEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <Pressable
        onPress={() => router.push(`/(doula)/client/${id}` as any)}
        className="flex-row items-center gap-1.5 mb-6"
      >
        <ArrowLeft size={16} color="#6B8E78" />
        <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">Voltar ao Prontuário</Text>
      </Pressable>

      <View className="mb-6">
        <View className="w-12 h-12 rounded-2xl bg-terracotta/20 items-center justify-center mb-3">
          <FileText size={24} color="#D97757" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Edição da Anamnese & Bebê</Text>
        <Text className="text-xs text-sage-700 dark:text-sage-300 mt-1">
          Ajustes na DUM, Ultrassom, histórico obstétrico ou dados de nascimento da cliente {id}.
        </Text>
      </View>
    </ScrollView>
  );
}
