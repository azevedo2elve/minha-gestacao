import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'sage' | 'terracotta' | 'flat';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...rest
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-dark-card border border-cream-400 dark:border-dark-border shadow-sm',
    sage: 'bg-sage-50 dark:bg-dark-card border border-sage-200 dark:border-dark-border',
    terracotta: 'bg-terracotta-50 dark:bg-dark-card border border-terracotta-200 dark:border-dark-border',
    flat: 'bg-cream dark:bg-dark-surface border border-cream-300 dark:border-dark-border',
  }[variant];

  return (
    <View className={`rounded-2xl p-5 ${variantStyles} ${className}`} {...rest}>
      {children}
    </View>
  );
};

