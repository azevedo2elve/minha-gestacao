import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  Copy,
  Check,
  Send,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  Baby,
  Phone,
} from 'lucide-react-native';
import { ProvisioningResult } from '@/services/anamnesis';
import { Button } from '@/components/ui/Button';

interface WhatsAppModalProps {
  visible: boolean;
  provisioningResult: ProvisioningResult | null;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  visible,
  provisioningResult,
  onClose,
}) => {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!provisioningResult || !provisioningResult.success) {
    return null;
  }

  const { credentials, whatsappLink, whatsappMessage } = provisioningResult;

  const handleCopy = async (key: string, text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2500);
      }
    } catch (_e) {
      // Fallback
    }
  };

  const handleOpenWhatsApp = async () => {
    try {
      if (whatsappLink) {
        await Linking.openURL(whatsappLink);
      }
    } catch (_e) {
      // Could not open URL
    }
  };

  const handleFinish = () => {
    onClose();
    router.replace('/(doula)/dashboard');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="bg-white dark:bg-dark-card w-full max-w-xl rounded-3xl border border-cream-300 dark:border-dark-border overflow-hidden shadow-2xl max-h-[90vh] flex-col">
          {/* Header */}
          <View className="bg-sage/10 dark:bg-sage-950/30 p-6 pb-5 border-b border-sage/20 items-center text-center">
            <View className="w-14 h-14 rounded-2xl bg-sage/20 items-center justify-center mb-3">
              <CheckCircle2 size={32} color="#6B8E78" />
            </View>
            <Text className="text-xl font-bold text-gray-800 dark:text-cream text-center">
              Gestante Cadastrada com Sucesso! 🌸
            </Text>
            <Text className="text-xs text-sage-800 dark:text-sage-300 text-center mt-1">
              O acesso foi criado com senha provisória e solicitação de troca no primeiro login (RN02).
            </Text>
          </View>

          {/* Body Content */}
          <ScrollView className="p-6 space-y-5" contentContainerClassName="gap-4">
            {/* Credentials Card */}
            <View className="bg-cream-100 dark:bg-dark-surface rounded-2xl p-4 border border-cream-400 dark:border-dark-border">
              <View className="flex-row items-center gap-2 mb-3">
                <Sparkles size={16} color="#6B8E78" />
                <Text className="text-xs font-bold text-gray-800 dark:text-cream">
                  Credenciais de Primeiro Acesso
                </Text>
              </View>

              {/* Mother & Baby */}
              <View className="flex-row items-center justify-between py-2 border-b border-cream-300 dark:border-dark-border">
                <View className="flex-row items-center gap-2">
                  <User size={15} color="#A8A29E" />
                  <Text className="text-xs text-gray-600 dark:text-dark-text">Gestante</Text>
                </View>
                <Text className="text-xs font-bold text-gray-800 dark:text-cream">
                  {credentials.full_name}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-cream-300 dark:border-dark-border">
                <View className="flex-row items-center gap-2">
                  <Baby size={15} color="#A8A29E" />
                  <Text className="text-xs text-gray-600 dark:text-dark-text">Bebê</Text>
                </View>
                <Text className="text-xs font-bold text-sage-800 dark:text-sage-300">
                  {credentials.baby_nickname}
                </Text>
              </View>

              {/* Email */}
              <View className="flex-row items-center justify-between py-2 border-b border-cream-300 dark:border-dark-border">
                <View className="flex-row items-center gap-2">
                  <Mail size={15} color="#A8A29E" />
                  <Text className="text-xs text-gray-600 dark:text-dark-text">E-mail</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-mono text-gray-800 dark:text-cream">
                    {credentials.email}
                  </Text>
                  <Pressable
                    onPress={() => handleCopy('email', credentials.email)}
                    className="p-1 rounded hover:bg-cream-300"
                  >
                    {copiedKey === 'email' ? (
                      <Check size={14} color="#059669" />
                    ) : (
                      <Copy size={14} color="#A8A29E" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Temporary Password */}
              <View className="flex-row items-center justify-between py-2.5">
                <View className="flex-row items-center gap-2">
                  <Lock size={15} color="#D97757" />
                  <Text className="text-xs text-gray-600 dark:text-dark-text">Senha Provisória</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="bg-terracotta/10 px-2.5 py-1 rounded-lg border border-terracotta/30">
                    <Text className="text-xs font-mono font-bold text-terracotta">
                      {credentials.temporaryPassword}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleCopy('password', credentials.temporaryPassword)}
                    className="p-1 rounded hover:bg-cream-300"
                  >
                    {copiedKey === 'password' ? (
                      <Check size={14} color="#059669" />
                    ) : (
                      <Copy size={14} color="#A8A29E" />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>

            {/* WhatsApp Invite Card */}
            <View className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Phone size={16} color="#059669" />
                  <Text className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Convite via WhatsApp
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleCopy('message', whatsappMessage)}
                  className="flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-dark-card border border-emerald-200 dark:border-emerald-800"
                >
                  {copiedKey === 'message' ? (
                    <>
                      <Check size={12} color="#059669" />
                      <Text className="text-[10px] font-semibold text-emerald-700">Copiada!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={12} color="#059669" />
                      <Text className="text-[10px] font-semibold text-emerald-700">Copiar Texto</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Message Preview Box */}
              <View className="bg-white dark:bg-dark-card p-3 rounded-xl border border-emerald-100 dark:border-dark-border">
                <Text className="text-[11px] text-gray-700 dark:text-cream leading-relaxed whitespace-pre-wrap font-sans">
                  {whatsappMessage}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-4 sm:p-6 bg-cream-50 dark:bg-dark-surface border-t border-cream-300 dark:border-dark-border flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="md"
              onPress={handleFinish}
              className="flex-1"
            >
              Ir ao Painel
            </Button>

            <Button
              variant="terracotta"
              size="md"
              onPress={handleOpenWhatsApp}
              icon={<Send size={16} color="#FFFFFF" />}
              className="flex-1"
            >
              Enviar via WhatsApp
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

