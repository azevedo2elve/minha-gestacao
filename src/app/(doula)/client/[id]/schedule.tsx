import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';

export default function ClientScheduleScreen() {
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
        <View className="w-12 h-12 rounded-2xl bg-sage/20 items-center justify-center mb-3">
          <Calendar size={24} color="#6B8E78" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Prescrições & Videochamadas</Text>
        <Text className="text-xs text-sage-700 dark:text-sage-300 mt-1">
          Gerenciamento de exercícios diários, visitas e salas de vídeo da cliente {id}.
        </Text>
      </View>
    </ScrollView>
  );
}
