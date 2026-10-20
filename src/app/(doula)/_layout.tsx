import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutDashboard, UserPlus, Inbox, LogOut, HeartHandshake } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';

export default function DoulaLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const { profile, logout } = useAuthStore();

  const navItems = [
    { label: 'Painel Gestantes', path: '/(doula)/dashboard', icon: LayoutDashboard },
    { label: 'Nova Anamnese', path: '/(doula)/new-anamnesis', icon: UserPlus },
    { label: 'Mensagens', path: '/(doula)/inbox', icon: Inbox },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (isTabletOrDesktop) {
    // Split View / Sidebar for Tablet & Desktop Web
    return (
      <View className="flex-1 flex-row bg-cream dark:bg-dark-bg">
        {/* Fixed Left Sidebar */}
        <View className="w-64 bg-white dark:bg-dark-card border-r border-cream-300 dark:border-dark-border p-5 flex-col justify-between">
          <View>
            {/* Doula App Header */}
            <View className="flex-row items-center gap-3 mb-8">
              <View className="w-10 h-10 rounded-xl bg-sage/20 items-center justify-center">
                <HeartHandshake size={22} color="#6B8E78" />
              </View>
              <View>
                <Text className="font-bold text-base text-sage-800 dark:text-cream">Minha Gestação</Text>
                <Text className="text-xs text-sage font-medium">Painel da Doula</Text>
              </View>
            </View>

            {/* Doula Status Badge */}
            <View className="bg-sage-50 dark:bg-dark-surface p-3 rounded-xl border border-sage-200 dark:border-dark-border mb-6">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <Text className="text-xs font-bold text-sage-800 dark:text-cream">
                  {profile?.full_name || 'Helena Ramos'}
                </Text>
              </View>
              <Text className="text-[11px] text-sage-700 dark:text-sage-300 font-medium">
                {profile?.doula_status === 'IN_LABOR_SUPPORT'
                  ? 'Status: Acompanhando Parto'
                  : profile?.doula_status === 'RESTING'
                  ? 'Status: Em Horário de Descanso'
                  : 'Status: Disponível Online'}
              </Text>
            </View>

            {/* Navigation Links */}
            <View className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.path);
                return (
                  <Pressable
                    key={item.path}
                    onPress={() => router.push(item.path as any)}
                    className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-sage text-white'
                        : 'text-gray-600 dark:text-dark-text hover:bg-cream active:bg-cream-300'
                    }`}
                  >
                    <Icon size={18} color={isActive ? '#FFFFFF' : '#6B8E78'} />
                    <Text
                      className={`text-xs font-semibold ${
                        isActive ? 'text-white' : 'text-gray-700 dark:text-cream'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Bottom Logout Button */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center gap-2 p-3 rounded-xl border border-cream-300 dark:border-dark-border active:bg-rose-50 dark:active:bg-rose-950/20"
          >
            <LogOut size={16} color="#7D331B" />
            <Text className="text-xs font-semibold text-terracotta-800 dark:text-terracotta-200">
              Sair da Conta
            </Text>
          </Pressable>
        </View>

        {/* Content Viewport */}
        <View className="flex-1 bg-cream-50 dark:bg-dark-bg">
          <Slot />
        </View>
      </View>
    );
  }

  // Mobile View (< 768px) with Bottom Bar
  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg" edges={['top']}>
      <View className="flex-1">
        <Slot />
      </View>

      {/* Mobile Bottom Navigation */}
      <View className="flex-row bg-white dark:bg-dark-card border-t border-cream-300 dark:border-dark-border py-2 px-4 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path as any)}
              className="items-center py-1"
            >
              <Icon size={20} color={isActive ? '#6B8E78' : '#A8A29E'} />
              <Text
                className={`text-[10px] mt-1 font-semibold ${
                  isActive ? 'text-sage-800 dark:text-sage-300' : 'text-gray-400'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={handleLogout} className="items-center py-1">
          <LogOut size={20} color="#7D331B" />
          <Text className="text-[10px] mt-1 text-terracotta-700 font-semibold">Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
