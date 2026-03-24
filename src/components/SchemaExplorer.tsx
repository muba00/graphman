import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Search } from "lucide-react";
import type {
  IntrospectionSchema,
  OperationType,
  SchemaTreeNode,
} from "../types/graphql";
import {
  buildOperationTree,
  getAvailableOperations,
} from "../utils/schemaParser";
import { FieldNode } from "./FieldNode";
import { colors, fonts, spacing } from "../theme";

interface SchemaExplorerProps {
  schema: IntrospectionSchema;
}

const sectionLabels: Record<OperationType, string> = {
  query: "Query",
  mutation: "Mutation",
  subscription: "Subscription",
};

/**
 * Filter top-level nodes (query/mutation names) by search term.
 * Children are kept intact — only root field names are matched.
 */
function filterTree(nodes: SchemaTreeNode[], term: string): SchemaTreeNode[] {
  const lower = term.toLowerCase();
  return nodes.filter((node) => node.name.toLowerCase().includes(lower));
}

export function SchemaExplorer({ schema }: SchemaExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const availableOps = useMemo(() => getAvailableOperations(schema), [schema]);

  const trees = useMemo(() => {
    const result: Partial<Record<OperationType, SchemaTreeNode[]>> = {};
    for (const op of availableOps) {
      const tree = buildOperationTree(schema, op);
      if (tree.length > 0) {
        result[op] = tree;
      }
    }
    return result;
  }, [schema, availableOps]);

  const filteredTrees = useMemo(() => {
    if (!searchTerm.trim()) {
      return trees;
    }
    const result: Partial<Record<OperationType, SchemaTreeNode[]>> = {};
    for (const op of availableOps) {
      const tree = trees[op];
      if (tree) {
        const filtered = filterTree(tree, searchTerm.trim());
        if (filtered.length > 0) {
          result[op] = filtered;
        }
      }
    }
    return result;
  }, [trees, searchTerm, availableOps]);

  const ops = availableOps.filter((op) => filteredTrees[op]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Filter fields..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {ops.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {searchTerm.trim()
              ? "No fields match your search."
              : "No operations available."}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.treeScroll}
          contentContainerStyle={styles.treeContent}
        >
          {ops.map((op) => (
            <View key={op} style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionLabels[op]}</Text>
              {filteredTrees[op]!.map((node) => (
                <FieldNode
                  key={node.path}
                  node={node}
                  depth={0}
                  operationType={op}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 28, // Smaller height
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 12, // Slightly smaller font
    color: colors.textPrimary,
    height: "100%",
    padding: 0,
    ...({ outlineStyle: "none" } as any),
  },
  treeScroll: {
    flex: 1,
  },
  treeContent: {
    paddingVertical: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.uiSize,
    fontWeight: "600",
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fonts.uiSize,
  },
});
