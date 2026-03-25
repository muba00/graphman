import React, { useEffect, useMemo, useRef, useState } from "react";
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
  // Reasonable default based on window height, falling back to 400
  const [topHeight, setTopHeight] = useState(() => {
    if (typeof window === "undefined") return 400;
    const saved = localStorage.getItem("graphman_topHeight");
    if (saved) return parseInt(saved, 10);
    return window.innerHeight / 2;
  });
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const dragInfo = useRef({ isDragging: false, startY: 0, startHeight: 0 });
  const currentTopHeight = useRef(topHeight);

  const generated = useMemo(
    () => generateAllQueries(state, trees),
    [state, trees],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo.current.isDragging) return;

      const dy = e.clientY - dragInfo.current.startY;
      const newHeight = Math.max(100, dragInfo.current.startHeight + dy);

      // Rough max height: Window height minus some allowance for top bar and variables header
      const maxHeight = window.innerHeight - 150;
      const finalHeight = Math.min(newHeight, maxHeight);
      setTopHeight(finalHeight);
      currentTopHeight.current = finalHeight;
    };

    const handleMouseUp = () => {
      if (dragInfo.current.isDragging) {
        dragInfo.current.isDragging = false;
        setIsDraggingHandle(false);
        document.body.style.cursor = "default";
        localStorage.setItem(
          "graphman_topHeight",
          currentTopHeight.current.toString(),
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.querySection, { height: topHeight }]}>
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

      {/* Interactive Horizontal Resize Handle */}
      <div
        className={`resize-handle-horizontal ${isDraggingHandle ? "dragging" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          dragInfo.current = {
            isDragging: true,
            startY: e.clientY,
            startHeight: topHeight,
          };
          setIsDraggingHandle(true);
          document.body.style.cursor = "row-resize";
        }}
      />

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
    backgroundColor: colors.bgSurface,
    display: "flex",
    flexDirection: "column",
  },
  querySection: {
    // Removed flex: 2 so height style takes precedence
    minHeight: 100,
    display: "flex",
    flexDirection: "column",
  },
  variablesSection: {
    flex: 1,
    minHeight: 100,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    lineHeight: 18,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fonts.uiSize,
    fontStyle: "italic",
  },
});
