import React from 'react';
import { View, Text, Modal, Pressable, Linking } from 'react-native';
import { AlertTriangle, Phone, MessageSquare, X, HeartHandshake } from 'lucide-react-native';

interface RedFlagAlertModalProps {
  visible: boolean;
  onClose: () => void;
  doulaPhone?: string | null;
  doulaName?: string;
  reasons: string[];
  gestationalAgeText?: string;
}

export function RedFlagAlertModal({
  visible,
  onClose,
  doulaPhone,
  doulaName = 'sua Doula',
  reasons,
  gestationalAgeText,
}: RedFlagAlertModalProps) {
  if (!visible) return null;

  const handleOpenWhatsApp = () => {
    const cleanPhone = doulaPhone ? doulaPhone.replace(/\D/g, '') : '';
    const reasonsText = reasons.join(', ');
    const msg = encodeURIComponent(
      `Olá ${doulaName}! Acabei de registrar no diário do Minha Gestação alguns sintomas importantes (${reasonsText}${
        gestationalAgeText ? ` com ${gestationalAgeText}` : ''
      }). Gostaria de orientações e acolhimento.`
    );
    const url = cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;

    Linking.openURL(url).catch(() => {});
  };

  const handleCallSamu = () => {
    Linking.openURL('tel:192').catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="bg-white dark:bg-dark-card border border-rose-300 dark:border-rose-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 items-center justify-center border border-rose-300">
                <AlertTriangle size={26} color="#E05252" />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-lg font-bold text-gray-900 dark:text-cream">
                  Aviso de Cuidado com Você
                </Text>
                <Text className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  Alerta Obstétrico Importante (RN04)
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              testID="close-red-flag-modal-btn"
              className="w-8 h-8 rounded-full bg-cream-300 dark:bg-dark-surface items-center justify-center active:bg-cream-400"
            >
              <X size={16} color="#718096" />
            </Pressable>
          </View>

          {/* Clinical Context */}
          <View className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-bold text-rose-900 dark:text-rose-200 mb-1">
              Sintomas que necessitam de atenção:
            </Text>
            {reasons.map((reason, index) => (
              <View key={index} className="flex-row items-start gap-1.5 mt-1">
                <Text className="text-rose-600 text-xs">•</Text>
                <Text className="text-xs text-gray-800 dark:text-rose-100 flex-1 leading-relaxed">
                  {reason}
                </Text>
              </View>
            ))}
          </View>

          {/* Gentle Guidance Text */}
          <Text className="text-xs text-gray-600 dark:text-dark-subtext mb-5 leading-relaxed">
            Mantenha a calma, mas não hesite em buscar apoio. Seu registro foi gravado com destaque
            para que sua doula acompanhe. Recomendamos que você avise sua equipe e dirija-se à
            maternidade ou pronto atendimento obstétrico de referência para avaliação.
          </Text>

          {/* Actions */}
          <View className="gap-2.5">
            <Pressable
              testID="btn-alert-whatsapp"
              onPress={handleOpenWhatsApp}
              className="w-full bg-sage active:bg-sage-600 py-3.5 px-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs"
            >
              <HeartHandshake size={18} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                Falar com {doulaName} no WhatsApp
              </Text>
            </Pressable>

            <Pressable
              testID="btn-alert-emergency"
              onPress={handleCallSamu}
              className="w-full bg-rose-600 active:bg-rose-700 py-3 px-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs"
            >
              <Phone size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                Ligar para Emergência (192)
              </Text>
            </Pressable>

            <Pressable
              testID="btn-alert-dismiss"
              onPress={onClose}
              className="w-full py-2.5 px-4 rounded-2xl items-center justify-center mt-1"
            >
              <Text className="text-xs font-semibold text-gray-500 dark:text-dark-subtext">
                Entendido, já estou sendo acompanhada
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
