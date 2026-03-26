import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "../theme";

interface Props {
  version: string;
  releaseNotes: string | null | undefined;
  isInstalling: boolean;
  progress: { downloaded: number; total: number } | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function UpdateModal({
  version,
  releaseNotes,
  isInstalling,
  progress,
  onConfirm,
  onDismiss,
}: Props) {
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Update Available</Text>
        <Text style={styles.subtitle}>
          Version {version} is ready to install.
        </Text>

        {releaseNotes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Release Notes</Text>
            <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator>
              <Text style={styles.notesText}>{releaseNotes}</Text>
            </ScrollView>
          </View>
        ) : null}

        {isInstalling ? (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {progressPercent !== null
                ? `Downloading… ${progressPercent}%`
                : "Preparing update…"}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent ?? 0}%` as `${number}%` },
                ]}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={onDismiss}
            disabled={isInstalling}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSecondary,
              pressed && styles.btnSecondaryPressed,
              isInstalling && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnTextSecondary}>Later</Text>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            disabled={isInstalling}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              pressed && styles.btnPrimaryPressed,
              isInstalling && styles.btnDisabled,
            ]}
          >
            <Text style={styles.btnTextPrimary}>
              {isInstalling ? "Installing…" : "Install & Relaunch"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    width: 440,
    maxWidth: "90%",
  },
  title: {
    color: colors.textPrimary,
    fontSize: fonts.uiSize + 2,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fonts.uiSize,
    marginBottom: spacing.xl,
  },
  notesContainer: {
    marginBottom: spacing.xl,
  },
  notesLabel: {
    color: colors.textMuted,
    fontSize: fonts.smallSize,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  notesScroll: {
    maxHeight: 160,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    padding: spacing.md,
  },
  notesText: {
    color: colors.textSecondary,
    fontSize: fonts.smallSize,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: fonts.smallSize,
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnPrimaryPressed: {
    backgroundColor: colors.accentHover,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryPressed: {
    backgroundColor: colors.bgHover,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnTextPrimary: {
    color: "#ffffff",
    fontSize: fonts.uiSize,
    fontWeight: "500",
  },
  btnTextSecondary: {
    color: colors.textSecondary,
    fontSize: fonts.uiSize,
    fontWeight: "500",
  },
});
