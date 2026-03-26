import React from "react";
import { StyleSheet, View } from "react-native";
import { Check, Circle, Minus } from "lucide-react";
import { colors } from "../theme";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
}

export function Checkbox({ checked, indeterminate }: CheckboxProps) {
  const isActive = checked || indeterminate;

  if (isActive) {
    return (
      <View style={styles.filledCircle}>
        {indeterminate ? (
          <Minus size={10} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        )}
      </View>
    );
  }

  return <Circle size={16} color={colors.checkboxBorder} strokeWidth={1.5} />;
}

const styles = StyleSheet.create({
  filledCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.checkboxChecked,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: -1,
  },
  dash: {
    width: 8,
    height: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
});
