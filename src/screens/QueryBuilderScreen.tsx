import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type {
  IntrospectionSchema,
  OperationType,
  SchemaTreeNode,
} from "../types/graphql";
import { fetchSchema } from "../services/introspection";
import {
  buildOperationTree,
  getAvailableOperations,
} from "../utils/schemaParser";
import { SelectionProvider } from "../state/selectionStore";
import { EndpointInput } from "../components/EndpointInput";
import { SchemaExplorer } from "../components/SchemaExplorer";
import { QueryPreview } from "../components/QueryPreview";
import { useAppDispatch } from "../state/appStore";
import { colors, fonts, spacing } from "../theme";

function QueryBuilderContent() {
  const [schema, setSchema] = useState<IntrospectionSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appDispatch = useAppDispatch();

  const trees = useMemo(() => {
    if (!schema) {
      return {};
    }
    const result: Partial<Record<OperationType, SchemaTreeNode[]>> = {};
    for (const op of getAvailableOperations(schema)) {
      const tree = buildOperationTree(schema, op);
      if (tree.length > 0) {
        result[op] = tree;
      }
    }
    return result;
  }, [schema]);

  const handleFetchSchema = useCallback(
    async (endpoint: string) => {
      setLoading(true);
      setError(null);

      const result = await fetchSchema(endpoint);

      if (result.ok) {
        setSchema(result.data.data.__schema);
        appDispatch({ type: "SET_LAST_ENDPOINT", payload: endpoint });
      } else {
        setError(result.error);
      }

      setLoading(false);
    },
    [appDispatch],
  );

  return (
    <View style={styles.container}>
      <EndpointInput
        onFetchSchema={handleFetchSchema}
        loading={loading}
        error={error}
      />

      {schema ? (
        <View style={styles.mainContent}>
          {/* Left panel: Schema explorer */}
          <View style={styles.explorerPanel}>
            <SchemaExplorer schema={schema} />
          </View>

          {/* Resize handle (visual separator for now) */}
          <View style={styles.separator} />

          {/* Right panel: Query preview */}
          <View style={styles.previewPanel}>
            <QueryPreview trees={trees} />
          </View>
        </View>
      ) : (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>GraphMan</Text>
          <Text style={styles.welcomeSubtitle}>
            Enter a GraphQL endpoint above to explore the schema
            {"\n"}and build queries with checkboxes.
          </Text>
        </View>
      )}
    </View>
  );
}

export function QueryBuilderScreen() {
  return (
    <SelectionProvider>
      <QueryBuilderContent />
    </SelectionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  explorerPanel: {
    flex: 1,
    minWidth: 300,
  },
  separator: {
    width: 1,
    backgroundColor: colors.border,
  },
  previewPanel: {
    flex: 1,
    minWidth: 300,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  welcomeSubtitle: {
    fontSize: fonts.uiSize,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
