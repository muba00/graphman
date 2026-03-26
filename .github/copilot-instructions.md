# Graphman — Project Guidelines

**Repository**: https://github.com/muba00/graphman

## Overview

Desktop GraphQL query builder (Postman-like). Users enter a GraphQL endpoint, the app fetches and parses the schema via introspection, displays fields as a checkbox tree, and generates query strings from selections.

## Stack

- **Frontend**: React 19 + TypeScript 5.8 + Vite 7, rendered via `react-native-web`
- **Desktop shell**: Tauri 2 (Rust backend, currently minimal — only a demo `greet` command)
- **No external GraphQL library** — custom introspection parsing and query generation
- **State**: React Context + `useReducer` (no Redux/Zustand)
- **Icons**: `lucide-react`

## Build & Dev

```sh
npm run dev        # Vite dev server on :1420 (Tauri expects this port)
npm run build      # tsc && vite build
npm run tauri dev  # Full Tauri desktop app (compiles Rust + launches frontend)
```

No test framework is configured yet.

## Architecture

```
src/
  services/introspection.ts  → Fetch schema via __schema introspection query
  utils/schemaParser.ts      → Parse introspection JSON → SchemaTreeNode[] tree (cycle detection, max depth 8)
  utils/queryGenerator.ts    → SelectionState + tree → GraphQL query strings
  state/selectionStore.tsx   → Context + useReducer: selections keyed by OperationType → path → FieldSelection
  components/                → UI: FieldNode, Checkbox, SchemaExplorer, EndpointInput, QueryPreview
  screens/QueryBuilderScreen.tsx → Main container composing everything
src-tauri/                   → Rust/Tauri shell (minimal, mostly boilerplate)
```

## Conventions

- **Components**: Function components, PascalCase filenames, explicit `Props` interfaces
- **Styling**: `StyleSheet.create()` from react-native-web — no CSS/SCSS files
- **Imports**: Named imports, destructured React Native imports (`import { View, Text } from 'react-native'`)
- **Field identity**: Dot-separated paths (e.g. `"user.posts.title"`)
- **Immutable state updates**: Deep clone via `JSON.parse(JSON.stringify())` in reducer
- **Hooks**: `useCallback`/`useMemo` with correct dependency arrays for performance

## Key Design Decisions

- **Tree-based selection model** mirrors GraphQL query structure; enables indeterminate checkbox states
- **Ancestor auto-selection**: Selecting a nested field auto-selects all parents
- **Subtree clearing**: Deselecting a parent clears all descendants
- **Schema tree built eagerly** with cycle detection (visited type tracking) and max depth 8
- **Argument formatting**: Auto-detects numbers/booleans/enums (unquoted) vs strings (quoted with escaping)

## Pitfalls

- Vite dev server must run on port 1420 — Tauri is configured to connect there
- `react-native` is aliased to `react-native-web` in `vite.config.ts` — use React Native APIs, not DOM
- The Rust backend handles network requests (e.g., `fetch_graphql` via Tauri IPC) to bypass CORS;
