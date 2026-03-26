import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, spacing } from "../theme";

type Tab = "query" | "variables" | "response";

interface QueryPreviewProps {
  queryText: string;
  variables: Record<string, unknown>;
  queryResult: unknown | null;
  queryLoading: boolean;
  queryError: string | null;
}

const TAB_LABELS: Record<Tab, string> = {
  query: "Query",
  variables: "Variables",
  response: "Response",
};

const TABS: Tab[] = ["query", "variables", "response"];

export function QueryPreview({
  queryText,
  variables,
  queryResult,
  queryLoading,
  queryError,
}: QueryPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("query");

  // Auto-switch to the Response tab as soon as the query starts loading
  useEffect(() => {
    if (queryLoading) {
      setActiveTab("response");
    }
  }, [queryLoading]);

  const hasError = queryError !== null;
  const hasSuccess = queryResult !== null && !hasError;

  const formattedResult = useMemo(() => {
    if (queryResult === null) return null;
    try {
      return JSON.stringify(queryResult, null, 2);
    } catch {
      return String(queryResult);
    }
  }, [queryResult]);

  const formattedVariables = useMemo(
    () =>
      JSON.stringify(
        Object.keys(variables).length > 0 ? variables : {},
        null,
        2,
      ),
    [variables],
  );

  return (
    <View style={styles.container}>
      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {TAB_LABELS[tab]}
              </Text>
              {tab === "response" &&
                !queryLoading &&
                (hasSuccess || hasError) && (
                  <View
                    style={[
                      styles.dot,
                      hasError ? styles.dotError : styles.dotSuccess,
                    ]}
                  />
                )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {activeTab === "query" && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {queryText ? (
              <Text style={styles.code} selectable>
                {queryText}
              </Text>
            ) : (
              <Text style={styles.placeholder}>
                Select fields from the schema to generate a query.
              </Text>
            )}
          </ScrollView>
        )}

        {activeTab === "variables" && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.code} selectable>
              {formattedVariables}
            </Text>
          </ScrollView>
        )}

        {activeTab === "response" && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            {queryLoading ? (
              <View style={styles.loadingMessage}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.placeholder, styles.loadingText]}>
                  Running query…
                </Text>
              </View>
            ) : queryError ? (
              <Text style={styles.errorText}>{queryError}</Text>
            ) : formattedResult !== null ? (
              <Text style={styles.code} selectable>
                {formattedResult}
              </Text>
            ) : (
              <Text style={styles.placeholder}>
                Run a query to see the response here.
              </Text>
            )}
          </ScrollView>
        )}
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
    overflow: "hidden",
  },
  // ── Tab bar ──
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.sm,
    height: 33,
  },
  tabs: {
    flex: 1,
    flexDirection: "row",
    alignSelf: "stretch",
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: fonts.uiSize,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 6,
  },
  dotSuccess: {
    backgroundColor: colors.success,
  },
  dotError: {
    backgroundColor: colors.error,
  },
  // ── Content area ──
  content: {
    flex: 1,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  // ── Text styles ──
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
  errorText: {
    color: colors.error,
    fontFamily: fonts.mono,
    fontSize: fonts.monoSize,
    lineHeight: 18,
  },
  loadingMessage: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: spacing.sm,
  },
});
