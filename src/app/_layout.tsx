import '../global.css';
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { getRouteRedirect } from '@/lib/auth-guard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, profile, isLoading, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading || !isInitialized) return;

    const redirectPath = getRouteRedirect({
      isAuthenticated,
      profile,
      segments: segments as string[],
    });

    if (redirectPath) {
      router.replace(redirectPath as any);
    }
  }, [isAuthenticated, profile, isLoading, isInitialized, segments, router]);

  if (isLoading || !isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-cream dark:bg-dark-bg">
        <View className="w-16 h-16 rounded-full bg-terracotta/20 items-center justify-center mb-4">
          <ActivityIndicator size="large" color="#D97757" />
        </View>
        <Text className="text-base font-bold text-gray-800 dark:text-cream">
          Minha Gestação
        </Text>
        <Text className="text-xs text-sage-700 dark:text-sage-300 mt-1">
          Carregando informações...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(pregnant)" options={{ headerShown: false }} />
            <Stack.Screen name="(doula)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/change-password" options={{ headerShown: false }} />
          </Stack>
        </AuthGuard>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
