import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  indeterminate,
  onPress,
  disabled,
}: CheckboxProps) {
  const isActive = checked || indeterminate;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[
        styles.container,
        isActive && styles.active,
        disabled && styles.disabled,
      ]}
    >
      {checked && !indeterminate && <Text style={styles.checkmark}>✓</Text>}
      {indeterminate && <View style={styles.dash} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.checkboxBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: {
    backgroundColor: colors.checkboxChecked,
    borderColor: colors.checkboxChecked,
  },
  disabled: {
    opacity: 0.4,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: -1,
  },
  dash: {
    width: 8,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});
