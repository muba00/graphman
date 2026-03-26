import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Eye, EyeOff } from "lucide-react";
import { colors, fonts, spacing } from "../theme";
import { HighlightedCode } from "./HighlightedCode";

type Tab = "query" | "variables" | "response" | "auth";

interface QueryPreviewProps {
  queryText: string;
  variables: Record<string, unknown>;
  queryResult: unknown | null;
  queryLoading: boolean;
  queryError: string | null;
  authToken: string;
  onAuthTokenChange: (token: string) => void;
}

const TAB_LABELS: Record<Tab, string> = {
  query: "Query",
  variables: "Variables",
  response: "Response",
  auth: "Authorization",
};

const TABS: Tab[] = ["query", "auth", "variables", "response"];

export function QueryPreview({
  queryText,
  variables,
  queryResult,
  queryLoading,
  queryError,
  authToken,
  onAuthTokenChange,
}: QueryPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("query");
  const [showToken, setShowToken] = useState(false);

  // Auto-switch to the Response tab as soon as the query starts loading
  useEffect(() => {
    if (queryLoading) {
      setActiveTab("response");
    }
  }, [queryLoading]);

  // Auto-switch to the Query tab when the query changes
  useEffect(() => {
    if (queryText) {
      setActiveTab("query");
    }
  }, [queryText]);

  const hasError = queryError !== null;
  const hasSuccess = queryResult !== null && !hasError;
  const hasVariables = Object.keys(variables).length > 0;
  const hasAuth = authToken.trim().length > 0;

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
              {tab === "variables" && hasVariables && (
                <View style={[styles.dot, styles.dotSuccess]} />
              )}
              {tab === "auth" && hasAuth && (
                <View style={[styles.dot, styles.dotSuccess]} />
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
              <HighlightedCode text={queryText} language="graphql" />
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
            <HighlightedCode text={formattedVariables} language="json" />
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
              <HighlightedCode text={formattedResult} language="json" />
            ) : (
              <Text style={styles.placeholder}>
                Run a query to see the response here.
              </Text>
            )}
          </ScrollView>
        )}

        {activeTab === "auth" && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.authForm}>
              <View style={styles.authField}>
                <Text style={styles.authLabel}>Auth Type</Text>
                <select
                  value="bearer"
                  style={{
                    backgroundColor: colors.bgInput,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: fonts.uiSize,
                    fontFamily: fonts.mono,
                    height: 28,
                    cursor: "pointer",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  <option value="bearer">Bearer Token</option>
                </select>
              </View>
              <View style={styles.authField}>
                <Text style={styles.authLabel}>Token</Text>
                <View style={styles.authInputRow}>
                  <TextInput
                    style={styles.authInput}
                    value={authToken}
                    onChangeText={onAuthTokenChange}
                    placeholder="Token"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showToken}
                  />
                  <Pressable
                    style={styles.authToggle}
                    onPress={() => setShowToken((v) => !v)}
                    accessibilityLabel={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? (
                      <EyeOff size={14} color={colors.textSecondary} />
                    ) : (
                      <Eye size={14} color={colors.textSecondary} />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
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
  authForm: {
    gap: spacing.lg,
  },
  authField: {
    gap: spacing.sm,
  },
  authLabel: {
    fontSize: fonts.uiSize,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  authInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    height: 28,
  },
  authInput: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: fonts.monoSize,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    height: 28,
  },
  authToggle: {
    paddingHorizontal: spacing.sm,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
