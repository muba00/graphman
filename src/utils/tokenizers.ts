import { colors } from "../theme";

export type Token = { text: string; color: string };

const GQL_KEYWORDS = new Set([
  "query",
  "mutation",
  "subscription",
  "fragment",
  "on",
  "true",
  "false",
  "null",
]);

export function tokenizeGraphQL(src: string): Token[] {
  const result: Token[] = [];
  let i = 0;

  const wsRe = /^[\t\n\r ]+/;
  const commentRe = /^#[^\n]*/;
  const blockStrRe = /^"""[\s\S]*?"""/;
  const strRe = /^"(?:[^"\\]|\\.)*"/;
  const numRe = /^-?[0-9]+(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?/;
  const spreadRe = /^\.\.\./;
  const varRe = /^\$[A-Za-z_]\w*/;
  const dirRe = /^@[A-Za-z_]\w*/;
  const nameRe = /^[A-Za-z_]\w*/;
  const punctChars = new Set([
    "{",
    "}",
    "(",
    ")",
    "[",
    "]",
    ":",
    "!",
    ",",
    "|",
    "=",
  ]);

  let parenDepth = 0;

  while (i < src.length) {
    const rest = src.slice(i);
    let m: RegExpExecArray | null;

    if ((m = wsRe.exec(rest))) {
      result.push({ text: m[0], color: colors.textPrimary });
      i += m[0].length;
    } else if ((m = commentRe.exec(rest))) {
      result.push({ text: m[0], color: colors.textMuted });
      i += m[0].length;
    } else if ((m = blockStrRe.exec(rest))) {
      result.push({ text: m[0], color: colors.syntaxArg });
      i += m[0].length;
    } else if ((m = strRe.exec(rest))) {
      result.push({ text: m[0], color: colors.syntaxArg });
      i += m[0].length;
    } else if ((m = numRe.exec(rest))) {
      result.push({ text: m[0], color: colors.syntaxScalar });
      i += m[0].length;
    } else if ((m = spreadRe.exec(rest))) {
      result.push({ text: m[0], color: colors.textSecondary });
      i += m[0].length;
    } else if ((m = varRe.exec(rest))) {
      result.push({ text: m[0], color: colors.syntaxDeprecated });
      i += m[0].length;
    } else if ((m = dirRe.exec(rest))) {
      result.push({ text: m[0], color: colors.syntaxDeprecated });
      i += m[0].length;
    } else if ((m = nameRe.exec(rest))) {
      const name = m[0];
      if (GQL_KEYWORDS.has(name)) {
        result.push({ text: name, color: colors.syntaxKeyword });
      } else if (/^[A-Z]/.test(name)) {
        result.push({ text: name, color: colors.syntaxType });
      } else if (parenDepth > 0) {
        result.push({ text: name, color: colors.syntaxArg });
      } else {
        result.push({ text: name, color: colors.syntaxField });
      }
      i += name.length;
    } else if (punctChars.has(src[i])) {
      const ch = src[i];
      if (ch === "(") parenDepth++;
      else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
      result.push({ text: ch, color: colors.textSecondary });
      i++;
    } else {
      result.push({ text: src[i], color: colors.textPrimary });
      i++;
    }
  }

  return result;
}

export function tokenizeJSON(src: string): Token[] {
  const result: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      let j = i + 1;
      while (
        j < src.length &&
        (src[j] === " " ||
          src[j] === "\t" ||
          src[j] === "\n" ||
          src[j] === "\r")
      )
        j++;
      result.push({ text: src.slice(i, j), color: colors.textPrimary });
      i = j;
      continue;
    }

    // String
    if (ch === '"') {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      const raw = src.slice(i, j);
      // Lookahead: treat as key if immediately followed by ':'
      let k = j;
      while (k < src.length && (src[k] === " " || src[k] === "\t")) k++;
      result.push({
        text: raw,
        color: src[k] === ":" ? colors.syntaxField : colors.syntaxArg,
      });
      i = j;
      continue;
    }

    // Number
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const numMatch = src
        .slice(i)
        .match(/^-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
      if (numMatch) {
        result.push({ text: numMatch[0], color: colors.syntaxScalar });
        i += numMatch[0].length;
        continue;
      }
    }

    // Boolean / null
    if (src.startsWith("true", i)) {
      result.push({ text: "true", color: colors.syntaxKeyword });
      i += 4;
      continue;
    }
    if (src.startsWith("false", i)) {
      result.push({ text: "false", color: colors.syntaxKeyword });
      i += 5;
      continue;
    }
    if (src.startsWith("null", i)) {
      result.push({ text: "null", color: colors.syntaxKeyword });
      i += 4;
      continue;
    }

    // Punctuation
    if (
      ch === "{" ||
      ch === "}" ||
      ch === "[" ||
      ch === "]" ||
      ch === ":" ||
      ch === ","
    ) {
      result.push({ text: ch, color: colors.textSecondary });
      i++;
      continue;
    }

    result.push({ text: ch, color: colors.textPrimary });
    i++;
  }

  return result;
}
