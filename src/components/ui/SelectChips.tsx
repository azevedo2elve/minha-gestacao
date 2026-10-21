import React from 'react';
import { View, Text, Pressable } from 'react-native';

export interface SelectChipOption<T extends string | number> {
  value: T;
  label: string;
  badge?: string;
  description?: string;
}

interface SelectChipsProps<T extends string | number> {
  label?: string;
  options: SelectChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  containerClassName?: string;
  variant?: 'sage' | 'terracotta';
}

export function SelectChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  containerClassName = '',
  variant = 'sage',
}: SelectChipsProps<T>) {
  const activeBg = variant === 'sage' ? 'bg-sage border-sage' : 'bg-terracotta border-terracotta';
  const activeText = 'text-white font-bold';

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-semibold text-gray-700 dark:text-dark-text mb-2">
          {label}
        </Text>
      )}
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              className={`px-3.5 py-2 rounded-xl border transition-all ${
                isSelected
                  ? `${activeBg} shadow-sm`
                  : 'bg-white dark:bg-dark-card border-cream-400 dark:border-dark-border active:bg-cream-200 dark:active:bg-dark-surface'
              }`}
            >
              <View className="flex-row items-center gap-1.5">
                <Text
                  className={`text-xs ${
                    isSelected ? activeText : 'text-gray-700 dark:text-cream font-medium'
                  }`}
                >
                  {option.label}
                </Text>
                {option.badge && (
                  <Text
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
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
                    isSelected ? 'text-white/80' : 'text-gray-400 dark:text-dark-subtext'
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

