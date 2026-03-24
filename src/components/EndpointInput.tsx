import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fonts, spacing } from '../theme';

interface EndpointInputProps {
  onFetchSchema: (endpoint: string) => void;
  loading: boolean;
  error: string | null;
}

export function EndpointInput({
  onFetchSchema,
  loading,
  error,
}: EndpointInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (trimmed) {
      onFetchSchema(trimmed);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://api.example.com/graphql"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onSubmitEditing={handleSubmit}
          editable={!loading}
        />
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Fetch Schema</Text>
          )}
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: fonts.monoSize,
    color: colors.textPrimary,
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 4,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
    height: 36,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fonts.uiSize,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.errorBg,
    borderRadius: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: fonts.smallSize,
  },
});
