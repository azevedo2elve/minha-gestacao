import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

interface NumberStepperProps {
  label: string;
  sublabel?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
  containerClassName?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
  label,
  sublabel,
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  suffix,
  containerClassName = '',
}) => {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <View
      className={`flex-row items-center justify-between p-3 rounded-xl bg-white dark:bg-dark-card border border-cream-400 dark:border-dark-border ${containerClassName}`}
    >
      <View className="flex-1 mr-3">
        <Text className="text-xs font-semibold text-gray-800 dark:text-cream">{label}</Text>
        {sublabel && (
          <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mt-0.5">{sublabel}</Text>
        )}
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={handleDecrement}
          disabled={!canDecrement}
          accessibilityLabel={`Diminuir ${label}`}
          className={`w-9 h-9 rounded-xl items-center justify-center border transition-colors ${
            canDecrement
              ? 'border-cream-400 dark:border-dark-border bg-cream-100 dark:bg-dark-surface active:bg-cream-300'
              : 'border-transparent bg-gray-100 dark:bg-dark-surface/50 opacity-40'
          }`}
        >
          <Minus size={16} color={canDecrement ? '#6B8E78' : '#A8A29E'} />
        </Pressable>

        <View className="min-w-[40px] items-center justify-center">
          <Text className="text-base font-bold text-gray-800 dark:text-cream">
            {value}
            {suffix ? <Text className="text-xs font-normal text-gray-500"> {suffix}</Text> : ''}
          </Text>
        </View>

        <Pressable
          onPress={handleIncrement}
          disabled={!canIncrement}
          accessibilityLabel={`Aumentar ${label}`}
          className={`w-9 h-9 rounded-xl items-center justify-center border transition-colors ${
            canIncrement
              ? 'border-cream-400 dark:border-dark-border bg-cream-100 dark:bg-dark-surface active:bg-cream-300'
              : 'border-transparent bg-gray-100 dark:bg-dark-surface/50 opacity-40'
          }`}
        >
          <Plus size={16} color={canIncrement ? '#6B8E78' : '#A8A29E'} />
        </Pressable>
      </View>
    </View>
  );
};

