import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock } from 'lucide-react-native';

export default function LoginScreen() {
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
          <View className="w-16 h-16 rounded-full bg-terracotta/20 items-center justify-center mb-3">
            <Lock size={28} color="#D97757" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Acesso ao Aplicativo</Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300 text-center mt-1">
            Entre com suas credenciais de Doula ou Gestante cadastrada
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-6 mb-4">
          <Text className="text-sm font-bold text-terracotta mb-2">Feature 01: Autenticação & RBAC</Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext leading-relaxed">
            Nesta próxima feature será integrado o formulário Supabase Auth, controle de sessão via Zustand e redirecionamento de primeiro acesso.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
