import type {
  FieldSelection,
  OperationType,
  SchemaTreeNode,
  SelectionState,
} from '../types/graphql';

/**
 * Generate all non-empty GraphQL operations from the current selection state.
 * Returns one string containing all operations separated by blank lines.
 */
export function generateAllQueries(
  state: SelectionState,
  trees: Partial<Record<OperationType, SchemaTreeNode[]>>,
): string {
  const parts: string[] = [];

  for (const op of ['query', 'mutation', 'subscription'] as OperationType[]) {
    const tree = trees[op];
    const opSelections = state.selections[op];
    if (!tree || !opSelections) {
      continue;
    }
    const q = generateOperationQuery(op, opSelections, tree);
    if (q) {
      parts.push(q);
    }
  }

  return parts.join('\n');
}

/**
 * Generate a single operation's query string.
 */
function generateOperationQuery(
  operationType: OperationType,
  selections: Record<string, FieldSelection>,
  tree: SchemaTreeNode[],
): string {
  const selectedFields = buildSelectionSet(selections, tree, 1);

  if (!selectedFields.trim()) {
    return '';
  }

  return `${operationType} {\n${selectedFields}}\n`;
}

/**
 * Recursively build the selection set string.
 */
function buildSelectionSet(
  selections: Record<string, FieldSelection>,
  treeNodes: SchemaTreeNode[],
  depth: number,
): string {
  const indent = '  '.repeat(depth);
  let result = '';

  for (const node of treeNodes) {
    const selection = selections[node.name];
    if (!selection?.selected) {
      continue;
    }

    const argsString = buildArgumentsString(selection.args);
    const hasSelectedChildren = hasAnySelectedChild(
      selection.subFields,
      node.children,
    );

    if (node.hasSubFields && hasSelectedChildren) {
      const childSelections = buildSelectionSet(
        selection.subFields,
        node.children,
        depth + 1,
      );
      result += `${indent}${node.name}${argsString} {\n${childSelections}${indent}}\n`;
    } else {
      result += `${indent}${node.name}${argsString}\n`;
    }
  }

  return result;
}

/**
 * Build the arguments string for a field, e.g. (id: "123", limit: 10).
 */
function buildArgumentsString(args: Record<string, string>): string {
  const entries = Object.entries(args).filter(([_, value]) => value !== '');
  if (entries.length === 0) {
    return '';
  }

  const argParts = entries.map(([name, value]) => {
    // Try to detect if the value is a number, boolean, or enum (no quotes)
    // Otherwise treat as string and wrap in quotes
    const formatted = formatArgValue(value);
    return `${name}: ${formatted}`;
  });

  return `(${argParts.join(', ')})`;
}

/**
 * Format an argument value for the query string.
 * - Numbers, booleans, null, and enum-like values are left unquoted
 * - Strings are wrapped in double quotes
 * - JSON objects/arrays are passed through
 */
function formatArgValue(value: string): string {
  // null
  if (value === 'null') {
    return 'null';
  }

  // boolean
  if (value === 'true' || value === 'false') {
    return value;
  }

  // number (integer or float)
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return value;
  }

  // enum-like value (UPPER_CASE identifier)
  if (/^[A-Z][A-Z0-9_]*$/.test(value)) {
    return value;
  }

  // JSON object or array
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    return value;
  }

  // Variable reference
  if (value.startsWith('$')) {
    return value;
  }

  // Default: string — wrap in quotes, escaping inner quotes
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Check whether any child in the subtree is selected.
 */
function hasAnySelectedChild(
  subFields: Record<string, FieldSelection>,
  treeChildren: SchemaTreeNode[],
): boolean {
  for (const child of treeChildren) {
    if (subFields[child.name]?.selected) {
      return true;
    }
  }
  return false;
}
