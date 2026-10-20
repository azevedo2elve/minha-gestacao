import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { UserPlus, ArrowLeft } from 'lucide-react-native';

export default function NewAnamnesisScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <Pressable
        onPress={() => router.push('/(doula)/dashboard')}
        className="flex-row items-center gap-1.5 mb-6"
      >
        <ArrowLeft size={16} color="#6B8E78" />
        <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">Voltar ao Painel</Text>
      </Pressable>

      <View className="mb-6">
        <View className="w-12 h-12 rounded-2xl bg-sage/20 items-center justify-center mb-3">
          <UserPlus size={24} color="#6B8E78" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Nova Anamnese Obstétrica</Text>
        <Text className="text-xs text-sage-700 dark:text-sage-300 mt-1">
          Cadastro guiado em 5 passos para provisionamento seguro da gestante.
        </Text>
      </View>

      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-6">
        <Text className="text-sm font-bold text-terracotta mb-2">Feature 02: Doula Anamnesis Wizard</Text>
        <Text className="text-xs text-gray-600 dark:text-dark-subtext leading-relaxed">
          Nesta feature será construído o stepper completo (Identificação, Cálculo IG/DPP com preview em tempo real, Histórico Obstétrico, Plano de Parto e Bebê) com integração da Edge Function e disparo de credenciais via WhatsApp.
        </Text>
      </View>
    </ScrollView>
  );
}
