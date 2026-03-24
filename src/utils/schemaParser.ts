import type {
  ArgumentNode,
  IntrospectionField,
  IntrospectionSchema,
  IntrospectionType,
  IntrospectionTypeRef,
  OperationType,
  SchemaTreeNode,
} from '../types/graphql';

/**
 * Unwrap NON_NULL and LIST wrappers to get the named (leaf) type.
 */
export function unwrapType(
  typeRef: IntrospectionTypeRef,
): IntrospectionTypeRef {
  let current = typeRef;
  while (current.ofType) {
    current = current.ofType;
  }
  return current;
}

/**
 * Build a human-readable type string, e.g. "[Post!]!" or "String".
 */
export function typeRefToString(typeRef: IntrospectionTypeRef): string {
  if (typeRef.kind === 'NON_NULL') {
    return `${typeRefToString(typeRef.ofType!)}!`;
  }
  if (typeRef.kind === 'LIST') {
    return `[${typeRefToString(typeRef.ofType!)}]`;
  }
  return typeRef.name ?? 'Unknown';
}

/**
 * Check whether a type ref points to an object/interface/union
 * (i.e. a type that has selectable sub-fields).
 */
function hasSelectableFields(typeRef: IntrospectionTypeRef): boolean {
  const named = unwrapType(typeRef);
  return (
    named.kind === 'OBJECT' ||
    named.kind === 'INTERFACE' ||
    named.kind === 'UNION'
  );
}

/**
 * Determine if an argument is required (non-null without a default value).
 */
function isArgRequired(arg: {
  type: IntrospectionTypeRef;
  defaultValue: string | null;
}): boolean {
  return arg.type.kind === 'NON_NULL' && arg.defaultValue === null;
}

/**
 * Look up a type by name in the schema.
 */
function findType(
  schema: IntrospectionSchema,
  name: string,
): IntrospectionType | undefined {
  return schema.types.find(t => t.name === name);
}

/**
 * Convert an IntrospectionField to an ArgumentNode list.
 */
function buildArgs(field: IntrospectionField): ArgumentNode[] {
  return field.args.map(arg => ({
    name: arg.name,
    description: arg.description,
    typeString: typeRefToString(arg.type),
    typeRef: arg.type,
    defaultValue: arg.defaultValue,
    isRequired: isArgRequired(arg),
  }));
}

/**
 * Recursively build tree nodes for the fields of a given type.
 *
 * @param schema     Full introspection schema (for type lookups)
 * @param typeName   Name of the object/interface type to expand
 * @param parentPath Dot-separated path prefix
 * @param visited    Set of type names already on the current branch (cycle detection)
 * @param maxDepth   Maximum recursion depth to prevent runaway expansion
 */
export function buildTreeNodes(
  schema: IntrospectionSchema,
  typeName: string,
  parentPath: string,
  visited: Set<string> = new Set(),
  maxDepth: number = 8,
): SchemaTreeNode[] {
  if (maxDepth <= 0) {
    return [];
  }

  const type = findType(schema, typeName);
  if (!type || !type.fields) {
    return [];
  }

  // Skip internal introspection types
  if (typeName.startsWith('__')) {
    return [];
  }

  return type.fields.map(field => {
    const namedType = unwrapType(field.type);
    const namedTypeName = namedType.name ?? '';
    const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
    const canExpand =
      hasSelectableFields(field.type) && !namedTypeName.startsWith('__');

    let children: SchemaTreeNode[] = [];
    if (canExpand && !visited.has(namedTypeName)) {
      const nextVisited = new Set(visited);
      nextVisited.add(namedTypeName);
      children = buildTreeNodes(
        schema,
        namedTypeName,
        fieldPath,
        nextVisited,
        maxDepth - 1,
      );
    }

    return {
      name: field.name,
      path: fieldPath,
      typeString: typeRefToString(field.type),
      description: field.description,
      hasSubFields: canExpand,
      kind: namedType.kind,
      args: buildArgs(field),
      children,
      isDeprecated: field.isDeprecated,
      deprecationReason: field.deprecationReason,
    };
  });
}

/**
 * Get the root type name for a given operation.
 */
export function getRootTypeName(
  schema: IntrospectionSchema,
  operation: OperationType,
): string | null {
  switch (operation) {
    case 'query':
      return schema.queryType?.name ?? null;
    case 'mutation':
      return schema.mutationType?.name ?? null;
    case 'subscription':
      return schema.subscriptionType?.name ?? null;
  }
}

/**
 * Build the full tree for a given operation type.
 */
export function buildOperationTree(
  schema: IntrospectionSchema,
  operation: OperationType,
): SchemaTreeNode[] {
  const rootTypeName = getRootTypeName(schema, operation);
  if (!rootTypeName) {
    return [];
  }
  return buildTreeNodes(schema, rootTypeName, '');
}

/**
 * Get available operation types for a schema.
 */
export function getAvailableOperations(
  schema: IntrospectionSchema,
): OperationType[] {
  const ops: OperationType[] = [];
  if (schema.queryType) {
    ops.push('query');
  }
  if (schema.mutationType) {
    ops.push('mutation');
  }
  if (schema.subscriptionType) {
    ops.push('subscription');
  }
  return ops;
}
