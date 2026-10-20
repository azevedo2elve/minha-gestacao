import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Inbox } from 'lucide-react-native';

export default function DoulaInboxScreen() {
  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <View className="mb-6">
        <View className="w-12 h-12 rounded-2xl bg-terracotta/20 items-center justify-center mb-3">
          <Inbox size={24} color="#D97757" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Central de Mensagens</Text>
        <Text className="text-xs text-sage-700 dark:text-sage-300 mt-1">
          Bate-papo em tempo real com todas as suas gestantes ativas.
        </Text>
      </View>

      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-6">
        <Text className="text-sm font-bold text-terracotta mb-2">Feature 07: Bate-Papo Realtime</Text>
        <Text className="text-xs text-gray-600 dark:text-dark-subtext leading-relaxed">
          Nesta feature será construída a central de atendimento com player de áudios, fotos de ultrassom e filtros por tópicos.
        </Text>
      </View>
    </ScrollView>
  );
}
