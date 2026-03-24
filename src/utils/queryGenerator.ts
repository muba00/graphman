import type {
  FieldSelection,
  OperationType,
  SchemaTreeNode,
  SelectionState,
} from "../types/graphql";

export interface GeneratedQueries {
  query: string;
  variables: Record<string, any>;
}

interface VariableDef {
  type: string;
  value: any;
}

/**
 * Generate all non-empty GraphQL operations from the current selection state.
 * Returns an object with the combined Operations string and a Variables JSON object mapping.
 */
export function generateAllQueries(
  state: SelectionState,
  trees: Partial<Record<OperationType, SchemaTreeNode[]>>,
): GeneratedQueries {
  const parts: string[] = [];
  const allVariables: Record<string, any> = {};

  for (const op of ["query", "mutation", "subscription"] as OperationType[]) {
    const tree = trees[op];
    const opSelections = state.selections[op];
    if (!tree || !opSelections) {
      continue;
    }

    // Each operation might define its own vars; we group them together.
    const res = generateOperationQuery(op, opSelections, tree);
    if (res.query) {
      parts.push(res.query);
      Object.assign(allVariables, res.variables);
    }
  }

  return {
    query: parts.join("\n"),
    variables: allVariables,
  };
}

/**
 * Generate a single operation's query string.
 */
function generateOperationQuery(
  operationType: OperationType,
  selections: Record<string, FieldSelection>,
  tree: SchemaTreeNode[],
): { query: string; variables: Record<string, any> } {
  const variableDefs: Record<string, VariableDef> = {};

  const selectedFields = buildSelectionSet(
    selections,
    tree,
    1,
    [],
    variableDefs,
  );

  if (!selectedFields.trim()) {
    return { query: "", variables: {} };
  }

  const varNames = Object.keys(variableDefs);
  let opHeader = operationType;
  if (varNames.length > 0) {
    const varDeclarations = varNames
      .map((vn) => `$${vn}: ${variableDefs[vn].type}`)
      .join(", ");
    opHeader += ` (${varDeclarations})`;
  }

  const actualVariables: Record<string, any> = {};
  for (const [k, v] of Object.entries(variableDefs)) {
    actualVariables[k] = v.value;
  }

  return {
    query: `${opHeader} {\n${selectedFields}}\n`,
    variables: actualVariables,
  };
}

/**
 * Recursively build the selection set string.
 */
function buildSelectionSet(
  selections: Record<string, FieldSelection>,
  treeNodes: SchemaTreeNode[],
  depth: number,
  path: string[],
  variableDefs: Record<string, VariableDef>,
): string {
  const indent = "  ".repeat(depth);
  let result = "";

  for (const node of treeNodes) {
    const selection = selections[node.name];
    if (!selection?.selected) {
      continue;
    }

    const currentPath = [...path, node.name];
    const argsString = buildArgumentsString(
      selection.args,
      node,
      currentPath,
      variableDefs,
    );

    const hasSelectedChildren = hasAnySelectedChild(
      selection.subFields,
      node.children,
    );

    if (node.hasSubFields && hasSelectedChildren) {
      const childSelections = buildSelectionSet(
        selection.subFields,
        node.children,
        depth + 1,
        currentPath,
        variableDefs,
      );
      result += `${indent}${node.name}${argsString} {\n${childSelections}${indent}}\n`;
    } else {
      result += `${indent}${node.name}${argsString}\n`;
    }
  }

  return result;
}

/**
 * Build the arguments string for a field, injecting variables instead of raw values.
 */
function buildArgumentsString(
  args: Record<string, string>,
  node: SchemaTreeNode,
  path: string[],
  variableDefs: Record<string, VariableDef>,
): string {
  const entries = Object.entries(args).filter(([_, value]) => value !== "");
  if (entries.length === 0) {
    return "";
  }

  const argParts = entries.map(([name, value]) => {
    const varName = `${path.join("_")}_${name}`;
    const argDef = node.args.find((a) => a.name === name);
    const typeStr = argDef ? argDef.typeString : "String!"; // Fallback

    // Determine value representation
    let parsedValue: any = value;
    if (value === "null") {
      parsedValue = null;
    } else if (value === "true") {
      parsedValue = true;
    } else if (value === "false") {
      parsedValue = false;
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      parsedValue = Number(value);
    } else if (
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))
    ) {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // Fallback to string if unparseable
      }
    }

    variableDefs[varName] = { type: typeStr, value: parsedValue };
    return `${name}: $${varName}`;
  });

  return `(${argParts.join(", ")})`;
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
