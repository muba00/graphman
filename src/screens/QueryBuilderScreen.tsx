import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useAppDispatch, useAppState } from "../state/appStore";
import { colors, fonts, spacing } from "../theme";

function QueryBuilderContent() {
  const [schema, setSchema] = useState<IntrospectionSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === "undefined") return 350;
    const saved = localStorage.getItem("graphman_leftWidth");
    if (saved) return parseInt(saved, 10);
    return window.innerWidth / 2;
  });
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const isDragging = useRef(false);
  const currentLeftWidth = useRef(leftWidth);

  const appDispatch = useAppDispatch();
  const { lastEndpoint } = useAppState();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      // Calculate new width ensuring it doesn't get too small or too large
      const newWidth = Math.max(
        250,
        Math.min(e.clientX, window.innerWidth - 300),
      );
      setLeftWidth(newWidth);
      currentLeftWidth.current = newWidth;
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setIsDraggingHandle(false);
        document.body.style.cursor = "default";
        localStorage.setItem(
          "graphman_leftWidth",
          currentLeftWidth.current.toString(),
        );
      }
    };

    const handleWindowResize = () => {
      const maxWidth = window.innerWidth - 300;
      if (currentLeftWidth.current > maxWidth) {
        const clamped = Math.max(250, maxWidth);
        setLeftWidth(clamped);
        currentLeftWidth.current = clamped;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

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

  // Auto-fetch if we have a persisted endpoint and haven't fetched yet
  useEffect(() => {
    if (lastEndpoint && !schema && !loading && !error) {
      handleFetchSchema(lastEndpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on initial mount

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
          <View style={[styles.explorerPanel, { width: leftWidth }]}>
            <SchemaExplorer schema={schema} />
          </View>

          {/* Interactive Resize Handle */}
          <div
            className={`resize-handle ${isDraggingHandle ? "dragging" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault(); // preventing selection
              isDragging.current = true;
              setIsDraggingHandle(true);
              document.body.style.cursor = "col-resize";
            }}
          />

          {/* Right panel: Query preview */}
          <View style={styles.previewPanel}>
            <QueryPreview trees={trees} />
          </View>
        </View>
      ) : (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Graphman</Text>
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
    overflow: "hidden",
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  },
  explorerPanel: {
    minWidth: 250,
    backgroundColor: colors.bg, // ensuring clean background behind nodes
    overflow: "hidden",
  },
  previewPanel: {
    flex: 1,
    minWidth: 300,
    overflow: "hidden",
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
