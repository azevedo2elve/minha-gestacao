import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, AlertCircle, ArrowLeft, HeartHandshake, Sparkles, UserCheck } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore, MockUserKey } from '@/stores/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, mockLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async () => {
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setFormError('Por favor, digite sua senha.');
      return;
    }

    const result = await login(email, password);
    if (!result.success && result.error) {
      setFormError(result.error);
    }
  };

  const handleQuickDemoLogin = async (key: MockUserKey) => {
    setFormError(null);
    clearError();
    await mockLogin(key);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView
        contentContainerClassName="p-6 max-w-md mx-auto w-full min-h-full justify-center"
        keyboardShouldPersistTaps="handled"
      >
        {/* Navigation back to index */}
        <Pressable
          onPress={() => router.replace('/')}
          className="flex-row items-center gap-1.5 mb-4 self-start"
        >
          <ArrowLeft size={16} color="#6B8E78" />
          <Text className="text-xs font-semibold text-sage-800 dark:text-sage-300">
            Apresentação do Projeto
          </Text>
        </Pressable>

        {/* Brand Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-2xl bg-terracotta/20 items-center justify-center mb-3 shadow-sm">
            <HeartHandshake size={32} color="#D97757" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream">
            Minha Gestação
          </Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300 text-center mt-1">
            Acesso ao Espaço da Doula e da Gestante
          </Text>
        </View>

        {/* Login Form Card */}
        <Card className="mb-5">
          <Text className="text-base font-bold text-gray-800 dark:text-cream mb-4">
            Entrar na sua Conta
          </Text>

          {/* Error Message */}
          {(formError || error) && (
            <View className="flex-row items-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-3 mb-4">
              <AlertCircle size={18} color="#CF7B82" />
              <Text className="text-xs text-rose-700 dark:text-rose-300 flex-1 ml-2">
                {formError || error}
              </Text>
            </View>
          )}

          <Input
            label="E-mail cadastrado"
            placeholder="seu.email@exemplo.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (formError) setFormError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            icon={<Mail size={18} color="#A8A29E" />}
          />

          <Input
            label="Senha"
            placeholder="Sua senha de acesso"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (formError) setFormError(null);
            }}
            isPassword
            icon={<Lock size={18} color="#A8A29E" />}
          />

          <Button
            variant="terracotta"
            size="lg"
            onPress={handleLogin}
            loading={isLoading}
            className="mt-2"
          >
            Entrar
          </Button>

          {/* RN02 Notice: Doula-First Provisioning */}
          <View className="mt-5 pt-4 border-t border-cream-300 dark:border-dark-border">
            <Text className="text-[11px] text-gray-500 dark:text-dark-subtext text-center leading-relaxed">
              <Text className="font-semibold text-gray-700 dark:text-gray-300">
                Não possui cadastro?{' '}
              </Text>
              O acesso de gestantes é provisionado exclusivamente pela Doula na primeira consulta (RN02).
            </Text>
          </View>
        </Card>

        {/* Quick Demo Access (Feature 01 Validation) */}
        <Card variant="flat" className="p-4">
          <View className="flex-row items-center gap-1.5 mb-2.5">
            <Sparkles size={16} color="#6B8E78" />
            <Text className="text-xs font-bold text-sage-800 dark:text-sage-300 uppercase tracking-wider">
              Acesso Rápido para Validação (Feature 01)
            </Text>
          </View>
          <Text className="text-[11px] text-gray-600 dark:text-dark-subtext mb-3">
            Selecione um perfil para validar as regras de RBAC e fluxos de tela:
          </Text>

          <View className="gap-2">
            <Pressable
              onPress={() => handleQuickDemoLogin('doula')}
              className="bg-white dark:bg-dark-card border border-sage-200 dark:border-dark-border p-3 rounded-xl flex-row items-center justify-between active:bg-sage-50"
            >
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full bg-sage/20 items-center justify-center">
                  <Text className="text-sm">👩‍⚕️</Text>
                </View>
                <View>
                  <Text className="text-xs font-bold text-sage-800 dark:text-cream">
                    Helena Ramos (Doula)
                  </Text>
                  <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">
                    Acesso direto ao Painel da Doula
                  </Text>
                </View>
              </View>
              <UserCheck size={16} color="#6B8E78" />
            </Pressable>

            <Pressable
              onPress={() => handleQuickDemoLogin('pregnantFirstAccess')}
              className="bg-white dark:bg-dark-card border border-terracotta-200 dark:border-dark-border p-3 rounded-xl flex-row items-center justify-between active:bg-terracotta-50"
            >
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full bg-terracotta/20 items-center justify-center">
                  <Text className="text-sm">🤰</Text>
                </View>
                <View>
                  <Text className="text-xs font-bold text-terracotta-800 dark:text-cream">
                    Camila Santos (Gestante - 1º Acesso)
                  </Text>
                  <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">
                    Testa bloqueio de rota e tela de troca de senha
                  </Text>
                </View>
              </View>
              <Text className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-md">
                1º Acesso
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleQuickDemoLogin('pregnantActive')}
              className="bg-white dark:bg-dark-card border border-rose-200 dark:border-dark-border p-3 rounded-xl flex-row items-center justify-between active:bg-rose-50"
            >
              <View className="flex-row items-center gap-2.5">
                <View className="w-8 h-8 rounded-full bg-rose/20 items-center justify-center">
                  <Text className="text-sm">🌸</Text>
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-800 dark:text-cream">
                    Maria Clara (Gestante - Ativa)
                  </Text>
                  <Text className="text-[10px] text-gray-500 dark:text-dark-subtext">
                    Acesso direto às Abas da Gestante (Home)
                  </Text>
                </View>
              </View>
              <UserCheck size={16} color="#D97757" />
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
