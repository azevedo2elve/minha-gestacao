import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Check, User, Calendar, Activity, Sparkles, Baby, LucideIcon } from 'lucide-react-native';

export interface StepDef {
  number: number;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
}

export const ANAMNESIS_STEPS: StepDef[] = [
  { number: 1, title: 'Identificação & Apoio', shortTitle: 'Identificação', icon: User },
  { number: 2, title: 'Cálculo Obstétrico', shortTitle: 'Cálculo IG/DPP', icon: Calendar },
  { number: 3, title: 'Histórico & Saúde', shortTitle: 'Histórico', icon: Activity },
  { number: 4, title: 'Plano & Notas da Doula', shortTitle: 'Plano de Parto', icon: Sparkles },
  { number: 5, title: 'Dados do Bebê', shortTitle: 'Bebê', icon: Baby },
];

interface StepperProps {
  currentStep: number;
  onStepPress?: (step: number) => void;
  maxReachedStep?: number;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepPress,
  maxReachedStep = currentStep,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const currentStepData = ANAMNESIS_STEPS.find((s) => s.number === currentStep) || ANAMNESIS_STEPS[0];
  const progressPercent = Math.round(((currentStep - 1) / (ANAMNESIS_STEPS.length - 1)) * 100);

  if (!isTablet) {
    // Mobile View: Compact Bar
    return (
      <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-4 mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-sage items-center justify-center">
              <Text className="text-white text-xs font-bold">{currentStep}</Text>
            </View>
            <Text className="text-xs font-bold text-gray-800 dark:text-cream">
              Passo {currentStep} de 5: {currentStepData.title}
            </Text>
          </View>
          <Text className="text-[11px] font-semibold text-sage-800 dark:text-sage-300">
            {progressPercent}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-2 w-full bg-cream-300 dark:bg-dark-surface rounded-full overflow-hidden">
          <View
            className="h-full bg-sage rounded-full transition-all"
            style={{ width: `${Math.max(10, progressPercent)}%` }}
          />
        </View>

        {/* Small step dots */}
        <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-cream-200 dark:border-dark-border">
          {ANAMNESIS_STEPS.map((s) => {
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;
            const isClickable = s.number <= maxReachedStep;

            return (
              <Pressable
                key={s.number}
                onPress={() => isClickable && onStepPress && onStepPress(s.number)}
                disabled={!isClickable}
                className="flex-row items-center gap-1 py-1"
              >
                <View
                  className={`w-5 h-5 rounded-full items-center justify-center ${
                    isCompleted
                      ? 'bg-sage text-white'
                      : isCurrent
                      ? 'bg-terracotta text-white'
                      : 'bg-cream-300 dark:bg-dark-surface'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      className={`text-[10px] font-bold ${
                        isCurrent ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {s.number}
                    </Text>
                  )}
                </View>
                <Text
                  className={`text-[10px] ${
                    isCurrent
                      ? 'font-bold text-terracotta'
                      : isCompleted
                      ? 'font-semibold text-sage-800 dark:text-sage-300'
                      : 'text-gray-400'
                  }`}
                >
                  {s.shortTitle}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // Tablet & Desktop View: Wide Horizontal Stepper
  return (
    <View className="bg-white dark:bg-dark-card border border-cream-300 dark:border-dark-border rounded-2xl p-5 mb-8">
      <View className="flex-row items-center justify-between relative">
        {ANAMNESIS_STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isClickable = step.number <= maxReachedStep;
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.number}>
              {/* Connector line between steps */}
              {index > 0 && (
                <View
                  className={`flex-1 h-1 mx-2 rounded transition-colors ${
                    step.number <= currentStep
                      ? 'bg-sage'
                      : 'bg-cream-300 dark:bg-dark-surface'
                  }`}
                />
              )}

              {/* Step Pill / Circle */}
              <Pressable
                onPress={() => isClickable && onStepPress && onStepPress(step.number)}
                disabled={!isClickable}
                className="items-center group"
              >
                <View
                  className={`w-10 h-10 rounded-2xl items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-sage shadow-sm'
                      : isCurrent
                      ? 'bg-terracotta ring-4 ring-terracotta/20 shadow-sm'
                      : 'bg-cream-200 dark:bg-dark-surface border border-cream-400 dark:border-dark-border'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <StepIcon size={18} color={isCurrent ? '#FFFFFF' : '#A8A29E'} />
                  )}
                </View>

                <View className="items-center mt-2">
                  <Text
                    className={`text-xs ${
                      isCurrent
                        ? 'font-bold text-terracotta'
                        : isCompleted
                        ? 'font-bold text-sage-800 dark:text-sage-300'
                        : 'font-medium text-gray-400 dark:text-dark-subtext'
                    }`}
                  >
                    Passo {step.number}
                  </Text>
                  <Text
                    className={`text-[11px] ${
                      isCurrent
                        ? 'font-semibold text-gray-800 dark:text-cream'
                        : isCompleted
                        ? 'text-gray-600 dark:text-dark-text'
                        : 'text-gray-400 dark:text-dark-subtext'
                    }`}
                  >
                    {step.shortTitle}
                  </Text>
                </View>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};
