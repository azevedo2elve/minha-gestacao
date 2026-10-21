import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { RatingOption } from '@/constants/diary';

interface RatingSelectorProps {
  label: string;
  description?: string;
  value: number | null;
  onChange: (value: number) => void;
  options: RatingOption[];
  variant?: 'sage' | 'terracotta' | 'blue' | 'purple';
  containerClassName?: string;
}

export function RatingSelector({
  label,
  description,
  value,
  onChange,
  options,
  variant = 'sage',
  containerClassName = '',
}: RatingSelectorProps) {
  const getActiveStyles = () => {
    switch (variant) {
      case 'terracotta':
        return {
          pill: 'bg-terracotta border-terracotta',
          text: 'text-white',
        };
      case 'blue':
        return {
          pill: 'bg-sky-600 border-sky-600',
          text: 'text-white',
        };
      case 'purple':
        return {
          pill: 'bg-indigo-600 border-indigo-600',
          text: 'text-white',
        };
      default:
        return {
          pill: 'bg-sage border-sage',
          text: 'text-white',
        };
    }
  };

  const activeStyles = getActiveStyles();
  const selectedOption = options.find((opt) => opt.level === value);

  return (
    <View className={`mb-5 ${containerClassName}`}>
      <Text className="text-xs font-semibold text-gray-700 dark:text-dark-text mb-1">
        {label}
      </Text>
      {description && (
        <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mb-2">
          {description}
        </Text>
      )}

      {/* Row of 5 buttons */}
      <View className="flex-row gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.level;
          return (
            <Pressable
              key={opt.level}
              testID={`rating-${variant}-${opt.level}`}
              onPress={() => onChange(opt.level)}
              className={`flex-1 py-2.5 px-1 items-center justify-center rounded-2xl border transition-all ${
                isSelected
                  ? `${activeStyles.pill} shadow-xs`
                  : 'bg-white dark:bg-dark-card border-cream-400 dark:border-dark-border active:bg-cream-200 dark:active:bg-dark-surface'
              }`}
            >
              <Text className="text-sm mb-0.5">{opt.emoji}</Text>
              <Text
                className={`text-xs font-bold ${
                  isSelected ? activeStyles.text : 'text-gray-700 dark:text-cream'
                }`}
              >
                {opt.level}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected description label */}
      {selectedOption && (
        <View className="mt-2 flex-row items-center justify-between px-1">
          <Text className="text-xs font-semibold text-gray-800 dark:text-cream">
            {selectedOption.label}
          </Text>
          {selectedOption.subtext && (
            <Text className="text-[11px] text-gray-500 dark:text-dark-subtext">
              {selectedOption.subtext}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
