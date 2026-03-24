import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { OperationType, SchemaTreeNode } from "../types/graphql";
import { useSelection } from "../state/selectionStore";
import { generateAllQueries } from "../utils/queryGenerator";
import { colors, fonts, spacing } from "../theme";

interface QueryPreviewProps {
  trees: Partial<Record<OperationType, SchemaTreeNode[]>>;
}

export function QueryPreview({ trees }: QueryPreviewProps) {
  const { state } = useSelection();

  const generated = useMemo(
    () => generateAllQueries(state, trees),
    [state, trees],
  );

  return (
    <View style={styles.container}>
      <View style={styles.querySection}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Generated Query</Text>
        </View>
        <ScrollView
          style={styles.codeScroll}
          contentContainerStyle={styles.codeContent}
        >
          {generated.query ? (
            <Text style={styles.code} selectable>
              {generated.query}
            </Text>
          ) : (
            <Text style={styles.placeholder}>
              Select fields from the schema to generate a query.
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.variablesSection}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Variables</Text>
        </View>
        <ScrollView
          style={styles.codeScroll}
          contentContainerStyle={styles.codeContent}
        >
          <Text style={styles.code} selectable>
            {generated.query && Object.keys(generated.variables).length > 0
              ? JSON.stringify(generated.variables, null, 2)
              : "{}"}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  querySection: {
    flex: 2,
  },
  variablesSection: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: fonts.smallSize,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeScroll: {
    flex: 1,
  },
  codeContent: {
    padding: spacing.md,
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: fonts.monoSize,
    color: colors.syntaxKeyword,
    lineHeight: 20,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fonts.uiSize,
    fontStyle: "italic",
  },
});
