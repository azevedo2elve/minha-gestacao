import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface MultiSelectChipOption {
  value: string;
  label: string;
  emoji?: string;
  badge?: string;
  isRedFlag?: boolean;
  description?: string;
}

interface MultiSelectChipsProps {
  label?: string;
  description?: string;
  options: MultiSelectChipOption[];
  values: string[];
  onChange: (values: string[]) => void;
  containerClassName?: string;
  variant?: 'sage' | 'terracotta' | 'rose';
  exclusiveValues?: string[]; // Values that uncheck everything else when selected (e.g. 'SEM_SINTOMAS')
}

export function MultiSelectChips({
  label,
  description,
  options,
  values,
  onChange,
  containerClassName = '',
  variant = 'sage',
  exclusiveValues = [],
}: MultiSelectChipsProps) {
  const handleToggle = (optionValue: string) => {
    const isCurrentlySelected = values.includes(optionValue);

    if (exclusiveValues.includes(optionValue)) {
      // If toggling an exclusive value on, set only this value; if already on, remove it
      if (isCurrentlySelected) {
        onChange([]);
      } else {
        onChange([optionValue]);
      }
      return;
    }

    // Normal option: remove any exclusive value that was selected
    let nextValues = values.filter((v) => !exclusiveValues.includes(v));

    if (isCurrentlySelected) {
      nextValues = nextValues.filter((v) => v !== optionValue);
    } else {
      nextValues = [...nextValues, optionValue];
    }

    onChange(nextValues);
  };

  const getActiveStyles = (isRedFlag?: boolean) => {
    if (isRedFlag) {
      return {
        bg: 'bg-rose-500 border-rose-600 shadow-xs',
        text: 'text-white font-bold',
      };
    }
    if (variant === 'terracotta') {
      return {
        bg: 'bg-terracotta border-terracotta shadow-xs',
        text: 'text-white font-bold',
      };
    }
    return {
      bg: 'bg-sage border-sage shadow-xs',
      text: 'text-white font-bold',
    };
  };

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">
          {label}
        </Text>
      )}
      {description && (
        <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mb-2">
          {description}
        </Text>
      )}

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = values.includes(option.value);
          const activeStyle = getActiveStyles(option.isRedFlag);

          return (
            <Pressable
              key={option.value}
              testID={`chip-${option.value}`}
              onPress={() => handleToggle(option.value)}
              className={`px-3 py-2 rounded-xl border transition-all ${
                isSelected
                  ? activeStyle.bg
                  : option.isRedFlag
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 active:bg-rose-100'
                  : 'bg-white dark:bg-dark-card border-cream-400 dark:border-dark-border active:bg-cream-200 dark:active:bg-dark-surface'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                {option.emoji && (
                  <Text className="text-xs">{option.emoji}</Text>
                )}
                <Text
                  className={`text-xs ${
                    isSelected
                      ? activeStyle.text
                      : option.isRedFlag
                      ? 'text-rose-700 dark:text-rose-300 font-semibold'
                      : 'text-gray-700 dark:text-cream font-medium'
                  }`}
                >
                  {option.label}
                </Text>
                {option.badge && (
                  <Text
                    className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white font-semibold'
                        : option.isRedFlag
                        ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold'
                        : 'bg-cream-300 dark:bg-dark-surface text-gray-600 dark:text-dark-subtext'
                    }`}
                  >
                    {option.badge}
                  </Text>
                )}
              </View>

              {option.description && (
                <Text
                  className={`text-[10px] mt-0.5 ${
                    isSelected
                      ? 'text-white/80'
                      : 'text-gray-400 dark:text-dark-subtext'
                  }`}
                >
                  {option.description}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
