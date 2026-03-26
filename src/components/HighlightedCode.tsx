import React, { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { colors, fonts } from "../theme";
import { tokenizeGraphQL, tokenizeJSON } from "../utils/tokenizers";

const MAX_HIGHLIGHT_CHARS = 100_000;

interface HighlightedCodeProps {
  text: string;
  language: "graphql" | "json";
}

export function HighlightedCode({ text, language }: HighlightedCodeProps) {
  const tokens = useMemo(() => {
    if (text.length > MAX_HIGHLIGHT_CHARS) return null;
    return language === "graphql" ? tokenizeGraphQL(text) : tokenizeJSON(text);
  }, [text, language]);

  return (
    <Text style={styles.code} selectable>
      {tokens
        ? tokens.map((tok, idx) => (
            <Text key={idx} style={{ color: tok.color }}>
              {tok.text}
            </Text>
          ))
        : text}
    </Text>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: fonts.mono,
    fontSize: fonts.monoSize,
    color: colors.textPrimary,
    lineHeight: 18,
  },
});
