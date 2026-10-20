import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

export type ButtonVariant = 'terracotta' | 'sage' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'terracotta',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  onPress,
  className = '',
  textClassName = '',
}) => {
  const isDisabled = disabled || loading;

  const baseStyles = 'flex-row items-center justify-center rounded-xl transition-all';

  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  }[size];

  const variantStyles = {
    terracotta: isDisabled
      ? 'bg-terracotta/50 opacity-60'
      : 'bg-terracotta active:bg-terracotta-600 shadow-sm',
    sage: isDisabled
      ? 'bg-sage/50 opacity-60'
      : 'bg-sage active:bg-sage-600 shadow-sm',
    outline: isDisabled
      ? 'border border-gray-300 dark:border-dark-border opacity-50 bg-transparent'
      : 'border border-cream-400 dark:border-dark-border active:bg-cream-300 dark:active:bg-dark-surface bg-transparent',
    ghost: isDisabled
      ? 'opacity-40 bg-transparent'
      : 'active:bg-black/5 dark:active:bg-white/5 bg-transparent',
    danger: isDisabled
      ? 'bg-rose-400/50 opacity-60'
      : 'bg-rose-600 active:bg-rose-700 shadow-sm',
  }[variant];

  const textSizeStyles = {
    sm: 'text-xs font-semibold',
    md: 'text-sm font-bold',
    lg: 'text-base font-bold',
  }[size];

  const textColorStyles = {
    terracotta: 'text-white',
    sage: 'text-white',
    outline: 'text-gray-700 dark:text-cream',
    ghost: 'text-gray-600 dark:text-dark-text',
    danger: 'text-white',
  }[variant];

  const spinnerColor = variant === 'outline' || variant === 'ghost' ? '#6B8E78' : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} className="mr-2" />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      <Text className={`${textSizeStyles} ${textColorStyles} ${textClassName}`}>
        {children}
      </Text>
    </Pressable>
  );
};

