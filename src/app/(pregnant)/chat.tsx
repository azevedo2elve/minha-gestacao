import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';

export default function PregnantChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-2xl mx-auto w-full">
        <View className="items-center py-8">
          <View className="w-16 h-16 rounded-2xl bg-terracotta/20 items-center justify-center mb-4">
            <MessageCircle size={32} color="#D97757" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Conversa com a Doula</Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext text-center mt-1 max-w-sm">
            Canal direto de suporte emocional e prático com mensagens, áudios e fotos em tempo real.
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border">
          <Text className="text-sm font-semibold text-terracotta">Feature 07: Bate-Papo Humanizado em Tempo Real</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mt-1 leading-relaxed">
            Layout estruturado com indicador de status da doula, player de áudio e tags de assuntos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
