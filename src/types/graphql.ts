/**
 * Types derived from the GraphQL Introspection specification.
 * These mirror the shape returned by the standard introspection query.
 * https://spec.graphql.org/October2021/#sec-Introspection
 */

// ── Introspection result envelope ────────────────────────────────────

export interface IntrospectionResult {
  data: {
    __schema: IntrospectionSchema;
  };
}

export interface IntrospectionSchema {
  queryType: { name: string } | null;
  mutationType: { name: string } | null;
  subscriptionType: { name: string } | null;
  types: IntrospectionType[];
  directives: IntrospectionDirective[];
}

// ── Type kinds ───────────────────────────────────────────────────────

export type TypeKind =
  | "SCALAR"
  | "OBJECT"
  | "INTERFACE"
  | "UNION"
  | "ENUM"
  | "INPUT_OBJECT"
  | "LIST"
  | "NON_NULL";

// ── Type references (recursive wrapper types) ────────────────────────

export interface IntrospectionTypeRef {
  kind: TypeKind;
  name: string | null;
  ofType: IntrospectionTypeRef | null;
}

// ── Full type definition ─────────────────────────────────────────────

export interface IntrospectionType {
  kind: TypeKind;
  name: string;
  description: string | null;
  fields: IntrospectionField[] | null;
  inputFields: IntrospectionInputValue[] | null;
  interfaces: IntrospectionTypeRef[] | null;
  enumValues: IntrospectionEnumValue[] | null;
  possibleTypes: IntrospectionTypeRef[] | null;
}

export interface IntrospectionField {
  name: string;
  description: string | null;
  args: IntrospectionInputValue[];
  type: IntrospectionTypeRef;
  isDeprecated: boolean;
  deprecationReason: string | null;
}

export interface IntrospectionInputValue {
  name: string;
  description: string | null;
  type: IntrospectionTypeRef;
  defaultValue: string | null;
}

export interface IntrospectionEnumValue {
  name: string;
  description: string | null;
  isDeprecated: boolean;
  deprecationReason: string | null;
}

export interface IntrospectionDirective {
  name: string;
  description: string | null;
  locations: string[];
  args: IntrospectionInputValue[];
}

// ── UI tree model ────────────────────────────────────────────────────

/** Represents a single node in the schema explorer tree. */
export interface SchemaTreeNode {
  /** Display name of this field / type */
  name: string;
  /** Fully-qualified path from root, e.g. "Query.user.posts" */
  path: string;
  /** Human-readable type string, e.g. "[Post!]!" */
  typeString: string;
  /** Description from the schema */
  description: string | null;
  /** Whether this node has selectable sub-fields */
  hasSubFields: boolean;
  /** Resolved kind of the named (unwrapped) type */
  kind: TypeKind;
  /** Arguments this field accepts */
  args: ArgumentNode[];
  /** Child fields (eagerly built; empty when cut off by cycle detection) */
  children: SchemaTreeNode[];
  /** The unwrapped named type, e.g. "Item" — used for lazy expansion */
  namedTypeName: string;
  /** Is this field deprecated? */
  isDeprecated: boolean;
  /** Deprecation reason */
  deprecationReason: string | null;
}

export interface ArgumentNode {
  name: string;
  description: string | null;
  typeString: string;
  typeRef: IntrospectionTypeRef;
  defaultValue: string | null;
  isRequired: boolean;
}

// ── Selection state ──────────────────────────────────────────────────

export type OperationType = "query" | "mutation" | "subscription";

export interface FieldSelection {
  selected: boolean;
  /** Child field selections keyed by field name */
  subFields: Record<string, FieldSelection>;
  /** Argument values keyed by argument name */
  args: Record<string, string>;
}

export interface SelectionState {
  /** Field selections keyed by operation type, then by field name */
  selections: Record<OperationType, Record<string, FieldSelection>>;
}
