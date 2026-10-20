import React from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, Calendar, BookOpen, HeartHandshake } from 'lucide-react-native';

export default function PregnantHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView contentContainerClassName="p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => router.replace('/')}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-300 dark:bg-dark-card"
          >
            <ArrowLeft size={16} color="#6B8E78" />
            <Text className="text-xs font-semibold text-sage-700 dark:text-sage-300">Voltar ao Início</Text>
          </Pressable>

          <View className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-full border border-rose-300">
            <Text className="text-xs font-semibold text-rose-600 dark:text-rose-300">Espaço da Gestante</Text>
          </View>
        </View>

        {/* Greeting */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-sage-600 dark:text-sage-400">Olá, Maria & Bebê Leo ✨</Text>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream mt-0.5">
            24 semanas e 3 dias de amor
          </Text>
          <Text className="text-xs text-gray-500 dark:text-dark-subtext mt-1">
            Seu bebê tem o tamanho aproximado de uma <Text className="font-semibold text-terracotta">Espiga de Milho 🌽</Text>
          </Text>
        </View>

        {/* Baby Evolution Card (Hero) */}
        <View className="bg-white dark:bg-dark-card rounded-3xl p-6 mb-6 shadow-sm border border-cream-300 dark:border-dark-border">
          <View className="items-center py-4">
            <View className="w-24 h-24 rounded-full bg-terracotta-100 dark:bg-terracotta-900/40 items-center justify-center mb-3">
              <Text className="text-4xl">🌽</Text>
            </View>
            <Text className="text-xl font-bold text-terracotta">Semana 24</Text>
            <Text className="text-xs text-sage-700 dark:text-sage-300 font-medium mt-1">2º Trimestre • 112 dias restantes</Text>
          </View>

          <View className="bg-cream dark:bg-dark-surface rounded-2xl p-4 mt-2">
            <Text className="text-xs font-bold text-sage-800 dark:text-cream mb-1">Dica carinhosa da sua Doula:</Text>
            <Text className="text-xs text-gray-600 dark:text-dark-subtext leading-relaxed">
              Os pulmões do bebê estão produzindo surfactante. Beba bastante água fresca e faça pausas suaves para respirar com o ventre.
            </Text>
          </View>
        </View>

        {/* Quick Actions (Responsive Grid) */}
        <View className={`gap-3 ${isTablet ? 'flex-row' : 'flex-col'} mb-6`}>
          <Pressable
            onPress={() => router.push('/(pregnant)/diary')}
            className="flex-1 bg-terracotta active:bg-terracotta-600 p-4 rounded-2xl shadow-sm flex-row items-center gap-3"
          >
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
              <BookOpen size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Preencher Diário de Hoje</Text>
              <Text className="text-terracotta-100 text-xs">Sintomas, emoções e movimentos</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(pregnant)/chat')}
            className="flex-1 bg-sage active:bg-sage-600 p-4 rounded-2xl shadow-sm flex-row items-center gap-3"
          >
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
              <HeartHandshake size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Falar com a Doula</Text>
              <Text className="text-sage-100 text-xs">Online para te acolher</Text>
            </View>
          </Pressable>
        </View>

        {/* Daily Checklist Placeholder */}
        <View className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-cream-300 dark:border-dark-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-gray-800 dark:text-cream">Tarefas de Hoje</Text>
            <Calendar size={16} color="#6B8E78" />
          </View>

          <View className="space-y-2">
            <View className="flex-row items-center gap-3 p-2.5 rounded-xl bg-cream dark:bg-dark-surface">
              <View className="w-5 h-5 rounded-md border-2 border-sage items-center justify-center" />
              <Text className="text-xs text-gray-700 dark:text-dark-text flex-1">
                Exercício na bola suíça (15 min de círculos pélvicos)
              </Text>
            </View>
            <View className="flex-row items-center gap-3 p-2.5 rounded-xl bg-cream dark:bg-dark-surface mt-2">
              <View className="w-5 h-5 rounded-md border-2 border-sage items-center justify-center" />
              <Text className="text-xs text-gray-700 dark:text-dark-text flex-1">
                Beber 2,5 litros de água
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
