import React from 'react';
import { View, Text } from 'react-native';
import { LiveObstetricPreview } from '@/services/anamnesis';
import { Calendar, Sparkles, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

interface ObstetricPreviewCardProps {
  preview: LiveObstetricPreview;
}

export const ObstetricPreviewCard: React.FC<ObstetricPreviewCardProps> = ({ preview }) => {
  if (!preview.isValid) {
    return (
      <View className="bg-cream-100 dark:bg-dark-card border border-dashed border-cream-400 dark:border-dark-border rounded-2xl p-5 mb-6">
        <View className="flex-row items-center gap-2 mb-2">
          {preview.errorMessage ? (
            <AlertTriangle size={18} color="#D97757" />
          ) : (
            <Sparkles size={18} color="#6B8E78" />
          )}
          <Text className="text-xs font-bold text-gray-700 dark:text-cream">
            {preview.errorMessage ? 'Atenção aos Dados Obstétricos' : 'Preview do Cálculo Obstétrico (RN01)'}
          </Text>
        </View>
        <Text className="text-xs text-gray-600 dark:text-dark-subtext leading-relaxed">
          {preview.errorMessage ||
            'Informe a Data da Última Menstruação (DUM) ou os dados do 1º Ultrassom para visualizar em tempo real a Idade Gestacional, DPP, Trimestre e percentual de evolução.'}
        </Text>
      </View>
    );
  }

  const { gestationalAge, dppDate, effectiveDum } = preview;
  if (!gestationalAge) return null;

  // Format DPP to DD/MM/YYYY
  const [dppYear, dppMonth, dppDay] = dppDate.split('-');
  const formattedDpp = `${dppDay}/${dppMonth}/${dppYear}`;

  // Format DUM to DD/MM/YYYY
  const [dumYear, dumMonth, dumDay] = effectiveDum.split('-');
  const formattedDum = `${dumDay}/${dumMonth}/${dumYear}`;

  const trimesterLabel =
    gestationalAge.trimester === 1
      ? '1º Trimestre (0-13s)'
      : gestationalAge.trimester === 2
      ? '2º Trimestre (14-27s)'
      : '3º Trimestre (28-42s)';

  const trimesterColor =
    gestationalAge.trimester === 1
      ? 'bg-sage-100 dark:bg-sage-950/40 text-sage-800 dark:text-sage-200 border-sage-300'
      : gestationalAge.trimester === 2
      ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300'
      : 'bg-terracotta-100 dark:bg-terracotta-950/40 text-terracotta-800 dark:text-terracotta-200 border-terracotta-300';

  return (
    <View className="bg-gradient-to-br from-white to-cream dark:from-dark-card dark:to-dark-surface border border-sage-300 dark:border-sage-800/40 rounded-2xl p-5 mb-6 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-cream-300 dark:border-dark-border">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-sage/20 items-center justify-center">
            <Sparkles size={16} color="#6B8E78" />
          </View>
          <View>
            <Text className="text-xs font-bold text-gray-800 dark:text-cream">
              Cálculo Obstétrico em Tempo Real
            </Text>
            <Text className="text-[11px] text-sage-700 dark:text-sage-300">
              DUM Efetiva: {formattedDum}
            </Text>
          </View>
        </View>

        <View className={`px-2.5 py-1 rounded-full border ${trimesterColor}`}>
          <Text className="text-[11px] font-bold">{trimesterLabel}</Text>
        </View>
      </View>

      {/* Main Stats: IG and DPP */}
      <View className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Gestational Age Card */}
        <View className="bg-white/80 dark:bg-dark-surface/60 rounded-xl p-3.5 border border-cream-300 dark:border-dark-border">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext uppercase tracking-wider mb-1">
            Idade Gestacional Hoje
          </Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-2xl font-bold text-sage-800 dark:text-sage-300">
              {gestationalAge.formatted}
            </Text>
            <Text className="text-xs font-bold text-gray-500">
              ({gestationalAge.formattedShort})
            </Text>
          </View>
          <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mt-1">
            {gestationalAge.totalDays} dias de gestação acumulados
          </Text>
        </View>

        {/* Due Date Card */}
        <View className="bg-white/80 dark:bg-dark-surface/60 rounded-xl p-3.5 border border-cream-300 dark:border-dark-border">
          <Text className="text-[11px] font-semibold text-gray-500 dark:text-dark-subtext uppercase tracking-wider mb-1">
            Data Provável do Parto (DPP)
          </Text>
          <View className="flex-row items-center gap-2">
            <Calendar size={20} color="#D97757" />
            <Text className="text-2xl font-bold text-terracotta">
              {formattedDpp}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 mt-1">
            <Clock size={12} color="#A8A29E" />
            <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
              {gestationalAge.daysRemaining >= 0
                ? `${gestationalAge.daysRemaining} dias restantes para as 40 semanas`
                : `${Math.abs(gestationalAge.daysRemaining)} dias pós-termo`}
            </Text>
          </View>
        </View>
      </View>

      {/* Gestational Progress Bar */}
      <View className="bg-white/60 dark:bg-dark-surface/40 rounded-xl p-3 border border-cream-300 dark:border-dark-border">
        <View className="flex-row justify-between items-center mb-1.5">
          <Text className="text-[11px] font-semibold text-gray-600 dark:text-dark-subtext">
            Progresso Gestacional (40 Semanas)
          </Text>
          <Text className="text-xs font-bold text-sage-800 dark:text-sage-300">
            {gestationalAge.progressPercentage}%
          </Text>
        </View>

        <View className="h-2.5 w-full bg-cream-300 dark:bg-dark-border rounded-full overflow-hidden">
          <View
            className="h-full bg-sage rounded-full"
            style={{ width: `${Math.min(100, Math.max(2, gestationalAge.progressPercentage))}%` }}
          />
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-[10px] text-gray-400">0 sem</Text>
          <View className="flex-row items-center gap-1">
            {gestationalAge.isFullTerm && (
              <View className="flex-row items-center gap-0.5 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} color="#059669" />
                <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  Gestação a Termo (≥ 37s)
                </Text>
              </View>
            )}
            <Text className="text-[10px] text-gray-400">Parto: 40 sem</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

