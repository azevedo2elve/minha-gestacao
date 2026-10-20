import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { getGestationalAge, formatToIsoDateString } from '@/lib/obstetrics';
import { AlertCircle, UserPlus, Heart, Calendar, ChevronRight } from 'lucide-react-native';

interface MockClient {
  id: string;
  name: string;
  babyNickname: string;
  dum: string;
  hasRedFlag: boolean;
  redFlagReason?: string;
}

export default function DoulaDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [doulaStatus, setDoulaStatus] = useState<'ONLINE' | 'IN_LABOR_SUPPORT' | 'RESTING'>('ONLINE');

  // Columns: 1 on mobile (<640px), 2 on tablet (640-1024px), 3 on desktop (>=1024px)
  const numColumns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  const mockClients: MockClient[] = [
    {
      id: '1',
      name: 'Camila Santos',
      babyNickname: 'Maya',
      dum: '2026-01-15',
      hasRedFlag: true,
      redFlagReason: 'Cefaleia com visão turva registrada hoje',
    },
    {
      id: '2',
      name: 'Juliana Ferreira',
      babyNickname: 'Theo',
      dum: '2026-03-02',
      hasRedFlag: false,
    },
    {
      id: '3',
      name: 'Beatriz Almeida',
      babyNickname: 'Gael',
      dum: '2026-04-20',
      hasRedFlag: false,
    },
  ];

  return (
    <ScrollView contentContainerClassName="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Top Bar with Status Control */}
      <View className="flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">Painel de Acompanhamento</Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300 mt-0.5">
            Gestantes ativas sob seu cuidado perinatal
          </Text>
        </View>

        {/* Status Selector */}
        <View className="flex-row items-center gap-1.5 bg-white dark:bg-dark-card p-1.5 rounded-2xl border border-cream-300 dark:border-dark-border">
          {(
            [
              { key: 'ONLINE', label: 'Disponível', color: 'bg-emerald-500' },
              { key: 'IN_LABOR_SUPPORT', label: 'Em Parto', color: 'bg-amber-500' },
              { key: 'RESTING', label: 'Descanso', color: 'bg-purple-500' },
            ] as const
          ).map((item) => {
            const isSelected = doulaStatus === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setDoulaStatus(item.key)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isSelected ? 'bg-cream-300 dark:bg-dark-surface' : ''
                }`}
              >
                <View className={`w-2 h-2 rounded-full ${item.color}`} />
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Priority Red Flags Section */}
      <View className="mb-6">
        <View className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/50 rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <AlertCircle size={18} color="#C25D3B" />
            <Text className="text-sm font-bold text-terracotta-900 dark:text-rose-200">
              Atenção Prioritária (Red Flags Obstétricas)
            </Text>
          </View>
          <Text className="text-xs text-gray-700 dark:text-rose-300 leading-relaxed">
            Camila Santos registrou cefaleia com visão turva há 2 horas. Entre em contato ou oriente avaliação médica.
          </Text>
        </View>
      </View>

      {/* Section Header with New Anamnesis CTA */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-bold text-gray-800 dark:text-cream">
          Gestantes ({mockClients.length})
        </Text>
        <Pressable
          onPress={() => router.push('/(doula)/new-anamnesis')}
          className="bg-sage active:bg-sage-600 px-3.5 py-2 rounded-xl flex-row items-center gap-2 shadow-sm"
        >
          <UserPlus size={16} color="#FFFFFF" />
          <Text className="text-xs font-bold text-white">Cadastrar Gestante</Text>
        </Pressable>
      </View>

      {/* Responsive Clients Grid */}
      <View
        className="gap-4"
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {mockClients.map((client) => {
          const gestAge = getGestationalAge(client.dum);
          const cardWidth =
            numColumns === 3 ? 'calc(33.333% - 11px)' : numColumns === 2 ? 'calc(50% - 8px)' : '100%';

          return (
            <View
              key={client.id}
              style={{ width: cardWidth as any }}
              className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-5 shadow-sm"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View>
                  <Text className="text-base font-bold text-gray-800 dark:text-cream">{client.name}</Text>
                  <Text className="text-xs text-sage font-medium">Bebê: {client.babyNickname}</Text>
                </View>
                {client.hasRedFlag && (
                  <View className="px-2 py-0.5 bg-rose-100 rounded-full border border-rose-300">
                    <Text className="text-[10px] font-bold text-terracotta-800">Alerta</Text>
                  </View>
                )}
              </View>

              {/* Gestational Badge */}
              <View className="bg-cream dark:bg-dark-surface p-3 rounded-xl mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-gray-500 dark:text-dark-subtext">Idade Gestacional</Text>
                  <Text className="text-xs font-bold text-terracotta">{gestAge.formattedShort}</Text>
                </View>
                <Text className="text-sm font-bold text-gray-800 dark:text-cream">{gestAge.formatted}</Text>
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-cream-300 dark:border-dark-border">
                  <Text className="text-[11px] text-gray-500">DPP: {formatToIsoDateString(gestAge.dppDate)}</Text>
                  <Text className="text-[11px] text-sage font-medium">{gestAge.trimester}º Trimestre</Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                onPress={() => router.push(`/(doula)/client/${client.id}` as any)}
                className="w-full bg-cream-300 dark:bg-dark-surface py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
              >
                <Text className="text-xs font-bold text-sage-800 dark:text-sage-300">Abrir Prontuário</Text>
                <ChevronRight size={14} color="#6B8E78" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
