import { invoke } from "@tauri-apps/api/core";
import type { IntrospectionResult } from "../types/graphql";

/**
 * Standard GraphQL introspection query.
 * Fetches the full schema including types, fields, arguments, enums, etc.
 */
const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            name
            description
            type {
              ...TypeRef
            }
            defaultValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          name
          description
          type {
            ...TypeRef
          }
          defaultValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }
      directives {
        name
        description
        locations
        args {
          name
          description
          type {
            ...TypeRef
          }
          defaultValue
        }
      }
    }
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export interface IntrospectionError {
  message: string;
}

export type IntrospectionResponse =
  | { ok: true; data: IntrospectionResult }
  | { ok: false; error: string };

/**
 * Fetch the GraphQL schema from an endpoint via introspection.
 */
export async function fetchSchema(
  endpoint: string,
  headers?: Record<string, string>,
): Promise<IntrospectionResponse> {
  try {
    const responseText = await invoke<string>("fetch_graphql", {
      endpoint,
      query: INTROSPECTION_QUERY,
      variables: null,
      headers: headers ?? null,
    });

    const json = JSON.parse(responseText);

    if (json.errors && json.errors.length > 0) {
      const messages = json.errors
        .map((e: IntrospectionError) => e.message)
        .join("; ");
      return { ok: false, error: `GraphQL errors: ${messages}` };
    }

    if (!json.data?.__schema) {
      return {
        ok: false,
        error: "Invalid introspection response: missing __schema",
      };
    }

    return { ok: true, data: json as IntrospectionResult };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during introspection";
    return { ok: false, error: message };
  }
}

// ── Query Execution ──────────────────────────────────────────────────

export type QueryExecutionResponse =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * Execute a GraphQL query against an endpoint via the Tauri backend.
 */
export async function executeQuery(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<QueryExecutionResponse> {
  try {
    const responseText = await invoke<string>("fetch_graphql", {
      endpoint,
      query,
      variables: Object.keys(variables).length > 0 ? variables : null,
      headers: headers ?? null,
    });

    const json = JSON.parse(responseText);
    return { ok: true, data: json };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error executing query";
    return { ok: false, error: message };
  }
}
