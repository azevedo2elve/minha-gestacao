import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, KeyRound } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-md mx-auto w-full justify-center flex-1">
        <Pressable
          onPress={() => router.replace('/')}
          className="flex-row items-center gap-1.5 mb-6"
        >
          <ArrowLeft size={16} color="#6B8E78" />
          <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">Voltar ao Início</Text>
        </Pressable>

        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-sage/20 items-center justify-center mb-3">
            <KeyRound size={28} color="#6B8E78" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Primeiro Acesso</Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300 text-center mt-1">
            Defina sua nova senha definitiva para acessar sua gestação
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-6">
          <Text className="text-sm font-bold text-sage-800 dark:text-cream mb-2">Troca de Senha Obrigatória</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext leading-relaxed">
            Gestantes recebem senha provisória da Doula e devem criar uma senha pessoal segura antes de navegar no app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
