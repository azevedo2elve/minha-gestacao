import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, LogOut, Phone, Shield } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';

export default function PregnantProfileScreen() {
  const router = useRouter();
  const { profile, user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const fullName = profile?.full_name || 'Maria Clara de Oliveira';
  const email = user?.email || 'gestante@exemplo.com';
  const phone = profile?.phone || '(11) 99876-5432';

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-2xl mx-auto w-full">
        {/* User Avatar & Name */}
        <View className="items-center py-6">
          <View className="w-20 h-20 rounded-full bg-terracotta/20 items-center justify-center mb-3">
            <User size={36} color="#D97757" />
          </View>
          <Text className="text-xl font-bold text-gray-800 dark:text-cream text-center">
            {fullName}
          </Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300 mt-0.5">
            Gestante • Doula: Helena Ramos
          </Text>
        </View>

        {/* Contact Info Card */}
        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border mb-4">
          <Text className="text-sm font-bold text-gray-800 dark:text-cream mb-3">
            Informações de Contato
          </Text>
          <View className="flex-row items-center gap-2 mb-2">
            <User size={15} color="#6B8E78" />
            <Text className="text-xs text-gray-600 dark:text-dark-subtext">{email}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Phone size={15} color="#6B8E78" />
            <Text className="text-xs text-gray-600 dark:text-dark-subtext">{phone}</Text>
          </View>
        </View>

        {/* Obstetric Data Card */}
        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border mb-4">
          <Text className="text-sm font-bold text-gray-800 dark:text-cream mb-2">
            Dados Obstétricos
          </Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext">
            DPP Estimada: 08/10/2026
          </Text>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mt-1">
            Maternidade: Hospital São Luiz
          </Text>
        </View>

        {/* Security & Access Info */}
        <View className="bg-sage-50 dark:bg-dark-card rounded-2xl p-4 border border-sage-200 dark:border-dark-border mb-6">
          <View className="flex-row items-center gap-2">
            <Shield size={16} color="#6B8E78" />
            <Text className="text-xs font-bold text-sage-800 dark:text-cream">
              Acesso Seguro Ativo
            </Text>
          </View>
          <Text className="text-[11px] text-sage-700 dark:text-sage-300 mt-1">
            Sua conta está protegida com senha pessoal criptografada.
          </Text>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="bg-cream-300 dark:bg-dark-surface p-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-rose-100 dark:active:bg-rose-950/30"
        >
          <LogOut size={16} color="#C25D3B" />
          <Text className="text-terracotta-700 font-bold text-xs">
            Sair da Conta
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
