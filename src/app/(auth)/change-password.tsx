import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound, Lock, AlertCircle, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { profile, changePassword, logout, isLoading, error, clearError } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    clearError();

    if (!newPassword) {
      setFormError('Por favor, informe sua nova senha.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('As senhas digitadas não coincidem. Verifique e tente novamente.');
      return;
    }

    const result = await changePassword(newPassword);
    if (result.success) {
      setSuccessMessage('Senha atualizada com sucesso! Redirecionando...');
      // The RouteGuard will automatically redirect because must_change_password is now false,
      // but we can also trigger router.replace directly for instantaneous feel
      setTimeout(() => {
        router.replace('/(pregnant)/home');
      }, 500);
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Gestante';

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-dark-bg">
      <ScrollView
        contentContainerClassName="p-6 max-w-md mx-auto w-full min-h-full justify-center"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Icon & Welcome */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-2xl bg-sage/20 items-center justify-center mb-3 shadow-sm">
            <KeyRound size={32} color="#6B8E78" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-cream text-center">
            Bem-vinda, {firstName}!
          </Text>
          <Text className="text-xs text-sage-700 dark:text-sage-300 text-center mt-1">
            Primeiro Acesso • Definição de Senha Pessoal
          </Text>
        </View>

        {/* Change Password Card */}
        <Card className="mb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <ShieldCheck size={20} color="#6B8E78" />
            <Text className="text-sm font-bold text-sage-800 dark:text-cream">
              Crie sua Senha Definitiva
            </Text>
          </View>

          <Text className="text-xs text-gray-600 dark:text-dark-subtext mb-5 leading-relaxed">
            Sua Doula criou seu acesso inicial com uma senha provisória. Para garantir a privacidade
            e a segurança dos dados da sua gestação, defina agora sua senha pessoal.
          </Text>

          {/* Success Message */}
          {successMessage && (
            <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-4">
              <CheckCircle2 size={18} color="#10B981" />
              <Text className="text-xs text-emerald-800 dark:text-emerald-200 flex-1 ml-2">
                {successMessage}
              </Text>
            </View>
          )}

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
            label="Nova Senha"
            placeholder="Digite pelo menos 6 caracteres"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              if (formError) setFormError(null);
            }}
            isPassword
            icon={<Lock size={18} color="#A8A29E" />}
          />

          <Input
            label="Confirme a Nova Senha"
            placeholder="Repita sua nova senha"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (formError) setFormError(null);
            }}
            isPassword
            icon={<Lock size={18} color="#A8A29E" />}
          />

          <Button
            variant="sage"
            size="lg"
            onPress={handleSubmit}
            loading={isLoading}
            className="mt-2"
          >
            Salvar Senha e Acessar
          </Button>

          {/* Logout Action */}
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-1.5 mt-5 pt-4 border-t border-cream-300 dark:border-dark-border"
          >
            <LogOut size={14} color="#7D331B" />
            <Text className="text-xs font-semibold text-terracotta-700 dark:text-terracotta-300">
              Sair e voltar ao login
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
