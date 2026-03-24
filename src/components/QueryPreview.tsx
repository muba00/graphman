import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { OperationType, SchemaTreeNode } from '../types/graphql';
import { useSelection } from '../state/selectionStore';
import { generateAllQueries } from '../utils/queryGenerator';
import { colors, fonts, spacing } from '../theme';

interface QueryPreviewProps {
  trees: Partial<Record<OperationType, SchemaTreeNode[]>>;
}

export function QueryPreview({ trees }: QueryPreviewProps) {
  const { state } = useSelection();

  const query = useMemo(() => generateAllQueries(state, trees), [state, trees]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Generated Query</Text>
      </View>
      <ScrollView
        style={styles.codeScroll}
        contentContainerStyle={styles.codeContent}
      >
        {query ? (
          <Text style={styles.code} selectable>
            {query}
          </Text>
        ) : (
          <Text style={styles.placeholder}>
            Select fields from the schema to generate a query.
          </Text>
        )}
      </ScrollView>
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
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: fonts.smallSize,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
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
    fontStyle: 'italic',
  },
});
