import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronRight } from "lucide-react";
import { useSelection, actions } from "../state/selectionStore";
import type {
  ArgumentNode,
  OperationType,
  SchemaTreeNode,
} from "../types/graphql";
import { colors, fonts, spacing } from "../theme";
import { Checkbox } from "./Checkbox";

interface FieldNodeProps {
  node: SchemaTreeNode;
  depth: number;
  operationType: OperationType;
}

/**
 * A recursive tree node representing a GraphQL field.
 * Shows a checkbox, field name, type, and optionally expandable children.
 */
export function FieldNode({ node, depth, operationType }: FieldNodeProps) {
  const { dispatch, isSelected, getFieldSelection } = useSelection();
  const [expanded, setExpanded] = useState(false);

  const path = useMemo(() => node.path.split("."), [node.path]);
  const selected = isSelected(operationType, path);
  const fieldSelection = getFieldSelection(operationType, path);

  // Determine indeterminate state: selected but some children not selected
  const indeterminate = useMemo(() => {
    if (!selected || !node.hasSubFields || node.children.length === 0) {
      return false;
    }
    const sub = fieldSelection?.subFields ?? {};
    const selectedChildCount = node.children.filter(
      (c) => sub[c.name]?.selected,
    ).length;
    return selectedChildCount > 0 && selectedChildCount < node.children.length;
  }, [selected, node, fieldSelection]);

  const handleToggle = useCallback(() => {
    dispatch(actions.toggleField(operationType, path, node.children));
    // Auto-expand when selecting a field with sub-fields or args
    if (!selected && (node.hasSubFields || node.args.length > 0)) {
      setExpanded(true);
    }
  }, [
    dispatch,
    operationType,
    path,
    selected,
    node.hasSubFields,
    node.args.length,
    node.children,
  ]);

  const handleExpandToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleArgChange = useCallback(
    (argName: string, value: string) => {
      dispatch(actions.setArgument(operationType, path, argName, value));
    },
    [dispatch, operationType, path],
  );

  const hasExpandableContent = node.hasSubFields || node.args.length > 0;
  const leftPadding = depth * 14;
  const filledArgCount = node.args.filter(
    (a) => fieldSelection?.args[a.name],
  ).length;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { paddingLeft: leftPadding },
          selected && styles.rowSelected,
        ]}
      >
        {/* Expand/collapse chevron */}
        {hasExpandableContent ? (
          <Pressable onPress={handleExpandToggle} style={styles.chevronHitArea}>
            <View style={[styles.chevron, expanded && styles.chevronExpanded]}>
              <ChevronRight size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.chevronPlaceholder} />
        )}

        {/* Checkbox */}
        <Checkbox
          checked={selected}
          indeterminate={indeterminate}
          onPress={handleToggle}
        />

        {/* Field name */}
        <Text
          style={[styles.fieldName, node.isDeprecated && styles.deprecated]}
        >
          {node.name}
        </Text>

        {/* Arguments badge — shown when field has args (always visible for discoverability) */}
        {node.args.length > 0 && (
          <View style={styles.argsBadge}>
            <Text
              style={[
                styles.argsBadgeText,
                filledArgCount > 0 && styles.argsBadgeFilled,
              ]}
            >
              {filledArgCount > 0
                ? `${filledArgCount}/${node.args.length}`
                : node.args.length}{" "}
              arg{node.args.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Type label */}
        <Text style={styles.typeLabel}>{node.typeString}</Text>
      </View>

      {/* Arguments panel — visible when node is expanded */}
      {expanded && node.args.length > 0 && (
        <View style={[styles.argsPanel, { marginLeft: leftPadding + 36 }]}>
          <View style={styles.argsBody}>
            {node.args.map((arg) => (
              <ArgumentRow
                key={arg.name}
                arg={arg}
                value={fieldSelection?.args[arg.name] ?? ""}
                onChange={handleArgChange}
              />
            ))}
          </View>
        </View>
      )}

      {/* Children */}
      {expanded &&
        node.children.map((child) => (
          <FieldNode
            key={child.path}
            node={child}
            depth={depth + 1}
            operationType={operationType}
          />
        ))}
    </View>
  );
}

interface ArgumentRowProps {
  arg: ArgumentNode;
  value: string;
  onChange: (argName: string, value: string) => void;
}

function ArgumentRow({ arg, value, onChange }: ArgumentRowProps) {
  return (
    <View style={styles.argRow}>
      <View style={styles.argHeaderContainer}>
        <View style={styles.argLabelRow}>
          <Text style={styles.argName}>
            {arg.name}
            {arg.isRequired && <Text style={styles.required}> *</Text>}
          </Text>
          <Text style={styles.argType}>{arg.typeString}</Text>
        </View>
        {arg.description && (
          <Text style={styles.argDescription} numberOfLines={2}>
            {arg.description}
          </Text>
        )}
      </View>
      <TextInput
        style={[styles.argInput, value ? styles.argInputFilled : null]}
        value={value}
        onChangeText={(v) => onChange(arg.name, v)}
        placeholder={arg.defaultValue ?? arg.typeString}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: spacing.xl,
    minHeight: 28,
  },
  rowSelected: {
    backgroundColor: "rgba(0, 122, 204, 0.06)",
  },
  chevronHitArea: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    width: 14,
    height: 14,
    paddingTop: 0,
  },
  chevronExpanded: {
    transform: [{ rotate: "90deg" }],
  },
  chevronPlaceholder: {
    width: 22,
  },
  fieldName: {
    fontFamily: fonts.mono,
    fontSize: fonts.monoSize,
    color: colors.syntaxField,
    marginLeft: spacing.sm,
  },
  deprecated: {
    textDecorationLine: "line-through",
    color: colors.syntaxDeprecated,
  },
  argsBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  argsBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  argsBadgeFilled: {
    color: colors.syntaxArg,
  },
  typeLabel: {
    fontFamily: fonts.mono,
    fontSize: fonts.smallSize,
    color: colors.syntaxType,
    marginLeft: "auto" as unknown as number,
  },
  argsPanel: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    marginRight: spacing.xl,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentMuted,
    paddingLeft: spacing.md,
  },
  argsBody: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  argRow: {
    gap: spacing.xs,
  },
  argHeaderContainer: {
    gap: 2,
    marginBottom: spacing.xs,
  },
  argLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  argName: {
    fontFamily: fonts.mono,
    fontSize: fonts.smallSize,
    color: colors.syntaxArg,
    fontWeight: "500",
  },
  required: {
    color: colors.error,
    fontSize: fonts.smallSize,
  },
  argType: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.syntaxType,
    opacity: 0.7,
  },
  argDescription: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  argInput: {
    fontFamily: fonts.mono,
    fontSize: fonts.smallSize,
    color: colors.textPrimary,
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 24,
  },
  argInputFilled: {
    borderColor: colors.accentMuted,
  },
});
