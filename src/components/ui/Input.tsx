import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  isPassword = false,
  containerClassName = '',
  secureTextEntry,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecured = isPassword ? !showPassword : secureTextEntry;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-semibold text-gray-700 dark:text-dark-text mb-1.5">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center bg-white dark:bg-dark-card border rounded-xl px-3.5 py-2.5 transition-colors ${
          error
            ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-900/10'
            : isFocused
            ? 'border-sage ring-1 ring-sage/30'
            : 'border-cream-400 dark:border-dark-border'
        }`}
      >
        {icon && <View className="mr-2.5 text-gray-400">{icon}</View>}

        <TextInput
          className="flex-1 text-sm text-gray-800 dark:text-cream py-0"
          placeholderTextColor="#A8A29E"
          secureTextEntry={isSecured}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={8}
            className="ml-2 p-1"
          >
            {showPassword ? (
              <EyeOff size={18} color="#A8A29E" />
            ) : (
              <Eye size={18} color="#A8A29E" />
            )}
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="text-[11px] text-rose-500 font-medium mt-1">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-[11px] text-gray-500 dark:text-dark-subtext mt-1">
          {hint}
        </Text>
      ) : null}
    </View>
  );
};

