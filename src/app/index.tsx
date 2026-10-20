import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, LogIn, LogOut, CheckCircle2, HeartHandshake } from 'lucide-react-native';
import { getGestationalAge, formatToIsoDateString } from '@/lib/obstetrics';
import { useAuthStore } from '@/stores/useAuthStore';

export default function IndexScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const { isAuthenticated, profile, logout } = useAuthStore();

  // Live test preview of obstetrics engine
  const [sampleDum] = useState('2026-04-10');
  const preview = getGestationalAge(sampleDum, new Date());

  const handleGoToRoleHome = () => {
    if (!profile) return;
    if (profile.role === 'DOULA') {
      router.push('/(doula)/dashboard');
    } else if (profile.must_change_password) {
      router.push('/(auth)/change-password');
    } else {
      router.push('/(pregnant)/home');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="w-16 h-16 rounded-2xl bg-terracotta/20 items-center justify-center mb-3 shadow-sm">
            <HeartHandshake size={32} color="#D97757" />
          </View>
          <Text className="text-3xl font-bold text-terracotta text-center">Minha Gestação</Text>
          <Text className="text-base text-sage-700 dark:text-sage-300 text-center mt-1">
            Acompanhamento Perinatal Humanizado
          </Text>
          <View className="mt-2 px-3 py-1 bg-sage/10 rounded-full border border-sage/20">
            <Text className="text-xs text-sage font-medium">
              Ambiente: {isTabletOrDesktop ? `Tablet/Web (${width}px)` : `Mobile (${width}px)`}
            </Text>
          </View>
        </View>

        {/* Current Auth Status Card */}
        {isAuthenticated && profile ? (
          <View className="bg-sage-50 dark:bg-dark-card border border-sage-300 dark:border-dark-border rounded-2xl p-5 mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 size={18} color="#10B981" />
                <Text className="text-sm font-bold text-sage-800 dark:text-cream">
                  Sessão Ativa: {profile.full_name} ({profile.role})
                </Text>
              </View>
              <Pressable
                onPress={() => logout()}
                className="flex-row items-center gap-1 bg-cream dark:bg-dark-surface px-2.5 py-1 rounded-lg border border-cream-400"
              >
                <LogOut size={12} color="#7D331B" />
                <Text className="text-[11px] font-semibold text-terracotta-800">Sair</Text>
              </Pressable>
            </View>
            <Text className="text-xs text-sage-700 dark:text-sage-300 mb-3">
              {profile.role === 'DOULA'
                ? 'Você está autenticada como Doula. Suas rotas são restritas ao painel administrativo.'
                : profile.must_change_password
                ? 'Primeiro acesso detectado: troca de senha obrigatória pendente.'
                : 'Você está autenticada como Gestante.'}
            </Text>
            <Pressable
              onPress={handleGoToRoleHome}
              className="bg-sage active:bg-sage-600 p-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-xs">
                {profile.role === 'DOULA'
                  ? 'Acessar Painel da Doula →'
                  : profile.must_change_password
                  ? 'Ir para Troca de Senha →'
                  : 'Acessar Espaço da Gestante →'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="bg-terracotta active:bg-terracotta-600 p-4 rounded-2xl shadow-sm mb-6 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                <LogIn size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-white font-bold text-base">Entrar na Plataforma</Text>
                <Text className="text-terracotta-100 text-xs">
                  Acesso único para Doulas e Gestantes cadastradas
                </Text>
              </View>
            </View>
            <Text className="text-white text-lg font-bold">→</Text>
          </Pressable>
        )}

        {/* Feature 01 Verification: RBAC & First-Access */}
        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 mb-6 shadow-sm border border-cream-300 dark:border-dark-border">
          <View className="flex-row items-center gap-2 mb-2">
            <ShieldCheck size={20} color="#6B8E78" />
            <Text className="text-base font-bold text-sage-800 dark:text-cream">
              Feature 01: Autenticação, RBAC & Primeiro Acesso
            </Text>
          </View>
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mb-3 leading-relaxed">
            Fluxo completo de controle de acesso implementado com Zustand + Supabase Auth.
            Rotas cruzadas são rigorosamente bloqueadas pelo RouteGuard.
          </Text>

          <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-xs">🔒</Text>
              <Text className="text-xs text-gray-700 dark:text-dark-text font-medium">
                <Text className="font-bold">Doula (Helena):</Text> Acessa apenas /(doula)/* com sidebar responsiva.
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs">🔑</Text>
              <Text className="text-xs text-gray-700 dark:text-dark-text font-medium">
                <Text className="font-bold">Gestante 1º Acesso (Camila):</Text> Forçada a trocar a senha provisória.
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs">🤰</Text>
              <Text className="text-xs text-gray-700 dark:text-dark-text font-medium">
                <Text className="font-bold">Gestante Ativa (Maria Clara):</Text> Acesso direto às abas humanizadas.
              </Text>
            </View>
          </View>
        </View>

        {/* Feature 00 Verification Card: Obstetrics Engine */}
        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 mb-6 shadow-sm border border-cream-300 dark:border-dark-border">
          <Text className="text-lg font-bold text-sage-800 dark:text-cream mb-2">
            Motor de Cálculo Obstétrico (RN01)
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mb-3">
            Demonstração com DUM de referência: {sampleDum}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl flex-1 min-w-[130px]">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">Idade Gestacional</Text>
              <Text className="text-base font-bold text-terracotta">{preview.formatted}</Text>
              <Text className="text-xs text-terracotta-600 font-semibold">{preview.formattedShort}</Text>
            </View>

            <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl flex-1 min-w-[130px]">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">Data Provável (DPP)</Text>
              <Text className="text-base font-bold text-sage">{formatToIsoDateString(preview.dppDate)}</Text>
              <Text className="text-xs text-sage-600">Restam {preview.daysRemaining} dias</Text>
            </View>

            <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl flex-1 min-w-[130px]">
              <Text className="text-xs text-gray-500 dark:text-dark-subtext">Trimestre & Progresso</Text>
              <Text className="text-base font-bold text-gray-800 dark:text-white">{preview.trimester}º Trimestre</Text>
              <Text className="text-xs text-gray-600 dark:text-dark-subtext">{preview.progressPercentage}% concluído</Text>
            </View>
          </View>
        </View>

        {/* Navigation to Viewports */}
        <Text className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-1">
          Navegação Direta (Protegida por RBAC)
        </Text>

        <View className="gap-3">
          <Pressable
            onPress={() => router.push('/(pregnant)/home')}
            className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border p-4 rounded-xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-gray-800 dark:text-cream font-bold text-base">Visão da Gestante (PREGNANT)</Text>
              <Text className="text-gray-500 dark:text-dark-subtext text-xs mt-0.5">
                Redireciona para login se não autenticada como gestante
              </Text>
            </View>
            <Text className="text-terracotta text-lg font-bold">→</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doula)/dashboard')}
            className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border p-4 rounded-xl shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-gray-800 dark:text-cream font-bold text-base">Visão da Doula (DOULA)</Text>
              <Text className="text-gray-500 dark:text-dark-subtext text-xs mt-0.5">
                Redireciona para login se não autenticada como doula
              </Text>
            </View>
            <Text className="text-sage text-lg font-bold">→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
