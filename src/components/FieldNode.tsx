import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronRight, ChevronDown } from "lucide-react";
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
  const [argsCollapsed, setArgsCollapsed] = useState(false);

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
    // Auto-expand when selecting a field with sub-fields
    if (!selected && node.hasSubFields) {
      setExpanded(true);
    }
  }, [
    dispatch,
    operationType,
    path,
    selected,
    node.hasSubFields,
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

  const leftPadding = depth * 20;
  const showArgs = selected && node.args.length > 0;
  const filledArgCount = node.args.filter(
    (a) => fieldSelection?.args[a.name],
  ).length;

  return (
    <View style={styles.container}>
      <View style={[styles.row, { paddingLeft: leftPadding }]}>
        {/* Expand/collapse chevron */}
        {node.hasSubFields ? (
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

      {/* Arguments panel — auto-shown when field is selected */}
      {showArgs && (
        <View style={[styles.argsPanel, { marginLeft: leftPadding + 40 }]}>
          <Pressable
            style={styles.argsPanelHeader}
            onPress={() => setArgsCollapsed((prev) => !prev)}
          >
            <View style={styles.argsPanelChevron}>
              {argsCollapsed ? (
                <ChevronRight size={14} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={14} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.argsPanelTitle}>Arguments</Text>
          </Pressable>

          {!argsCollapsed && (
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
          )}
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
      <View style={styles.argLabelRow}>
        <Text style={styles.argName}>
          {arg.name}
          {arg.isRequired && <Text style={styles.required}> *</Text>}
        </Text>
        <Text style={styles.argType}>{arg.typeString}</Text>
      </View>
      {arg.description && (
        <Text style={styles.argDescription} numberOfLines={1}>
          {arg.description}
        </Text>
      )}
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
    paddingRight: spacing.md,
    minHeight: 28,
  },
  chevronHitArea: {
    width: 20,
    height: 20,
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
    width: 20,
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
    marginLeft: spacing.sm,
  },
  argsPanel: {
    marginBottom: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentMuted,
    marginRight: spacing.md,
  },
  argsPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  argsPanelChevron: {
    width: 14,
    height: 14,
    marginRight: spacing.xs,
  },
  argsPanelTitle: {
    fontSize: fonts.smallSize,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  argsBody: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  argRow: {
    gap: 2,
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
  },
  required: {
    color: colors.error,
    fontSize: fonts.smallSize,
  },
  argType: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textMuted,
  },
  argDescription: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  argInput: {
    fontFamily: fonts.mono,
    fontSize: fonts.smallSize,
    color: colors.textPrimary,
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  argInputFilled: {
    borderColor: colors.accentMuted,
  },
});
