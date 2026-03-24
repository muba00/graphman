import React, { createContext, useContext, useReducer } from "react";
import type {
  FieldSelection,
  OperationType,
  SchemaTreeNode,
  SelectionState,
} from "../types/graphql";

// ── Actions ──────────────────────────────────────────────────────────

type Action =
  | {
      type: "TOGGLE_FIELD";
      operationType: OperationType;
      path: string[];
      children: SchemaTreeNode[];
    }
  | {
      type: "SET_ARGUMENT";
      operationType: OperationType;
      path: string[];
      argName: string;
      value: string;
    }
  | { type: "CLEAR_SELECTIONS" }
  | {
      type: "SELECT_SUBTREE";
      operationType: OperationType;
      path: string[];
      fieldNames: string[];
    };

// ── Helpers ──────────────────────────────────────────────────────────

function getOrCreateSelection(
  root: Record<string, FieldSelection>,
  path: string[],
): { parent: Record<string, FieldSelection>; key: string } {
  let current = root;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!current[segment]) {
      current[segment] = { selected: false, subFields: {}, args: {} };
    }
    current = current[segment].subFields;
  }
  return { parent: current, key: path[path.length - 1] };
}

function isFieldSelected(
  selections: Record<string, FieldSelection>,
  path: string[],
): boolean {
  let current = selections;
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    if (!current[segment]) {
      return false;
    }
    if (i === path.length - 1) {
      return current[segment].selected;
    }
    current = current[segment].subFields;
  }
  return false;
}

/** Deep clone selections (they're plain objects, so JSON round-trip works). */
function cloneSelections(
  selections: Record<string, FieldSelection>,
): Record<string, FieldSelection> {
  return JSON.parse(JSON.stringify(selections));
}

/**
 * When selecting a field, ensure all ancestor fields are also selected.
 */
function ensureAncestorsSelected(
  selections: Record<string, FieldSelection>,
  path: string[],
): void {
  let current = selections;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!current[segment]) {
      current[segment] = { selected: false, subFields: {}, args: {} };
    }
    current[segment].selected = true;
    current = current[segment].subFields;
  }
}

/**
 * Remove a field's entire subtree selections (when unchecking a parent).
 */
function clearSubtree(selection: FieldSelection): void {
  selection.subFields = {};
}

/**
 * Select only leaf children (those without sub-fields).
 * Children that have their own children are left unselected.
 */
function selectAllDescendants(
  selection: FieldSelection,
  children: SchemaTreeNode[],
): void {
  for (const child of children) {
    if (child.hasSubFields && child.children.length > 0) {
      // Skip — don't auto-select fields that have their own children
      continue;
    }
    if (!selection.subFields[child.name]) {
      selection.subFields[child.name] = {
        selected: true,
        subFields: {},
        args: {},
      };
    } else {
      selection.subFields[child.name].selected = true;
    }
  }
}

/** Get the selections for a specific operation type, cloned for mutation. */
function getOpSelections(
  state: SelectionState,
  opType: OperationType,
): Record<string, FieldSelection> {
  return cloneSelections(state.selections[opType] ?? {});
}

/** Return new state with updated selections for a specific operation type. */
function withOpSelections(
  state: SelectionState,
  opType: OperationType,
  opSelections: Record<string, FieldSelection>,
): SelectionState {
  return {
    ...state,
    selections: { ...state.selections, [opType]: opSelections },
  };
}

// ── Reducer ──────────────────────────────────────────────────────────

const SELECTION_STATE_KEY = "graphman_selection_state";

function selectionReducer(
  state: SelectionState,
  action: Action,
): SelectionState {
  let newState: SelectionState;

  switch (action.type) {
    case "CLEAR_SELECTIONS":
      newState = {
        ...state,
        selections: { query: {}, mutation: {}, subscription: {} },
      };
      break;

    case "TOGGLE_FIELD": {
      const { operationType, path, children } = action;
      const selections = getOpSelections(state, operationType);
      const { parent, key } = getOrCreateSelection(selections, path);

      if (!parent[key]) {
        parent[key] = { selected: false, subFields: {}, args: {} };
      }

      const wasSelected = parent[key].selected;
      parent[key].selected = !wasSelected;

      if (!wasSelected) {
        ensureAncestorsSelected(selections, path);
        // Select all descendants
        if (children.length > 0) {
          selectAllDescendants(parent[key], children);
        }
      } else {
        clearSubtree(parent[key]);
      }

      newState = withOpSelections(state, operationType, selections);
      break;
    }

    case "SELECT_SUBTREE": {
      const { operationType, path, fieldNames } = action;
      const selections = getOpSelections(state, operationType);

      const { parent, key } = getOrCreateSelection(selections, path);
      if (!parent[key]) {
        parent[key] = { selected: false, subFields: {}, args: {} };
      }
      parent[key].selected = true;
      ensureAncestorsSelected(selections, path);

      for (const fieldName of fieldNames) {
        if (!parent[key].subFields[fieldName]) {
          parent[key].subFields[fieldName] = {
            selected: true,
            subFields: {},
            args: {},
          };
        } else {
          parent[key].subFields[fieldName].selected = true;
        }
      }

      newState = withOpSelections(state, operationType, selections);
      break;
    }

    case "SET_ARGUMENT": {
      const { operationType, path, argName, value } = action;
      const selections = getOpSelections(state, operationType);
      const { parent, key } = getOrCreateSelection(selections, path);

      if (!parent[key]) {
        parent[key] = { selected: false, subFields: {}, args: {} };
      }

      if (value === "") {
        delete parent[key].args[argName];
      } else {
        parent[key].args[argName] = value;
      }

      newState = withOpSelections(state, operationType, selections);
      break;
    }

    default:
      return state;
  }

  try {
    localStorage.setItem(SELECTION_STATE_KEY, JSON.stringify(newState));
  } catch (e) {
    // ignore
  }

  return newState;
}

// ── Context ──────────────────────────────────────────────────────────

const initialState: SelectionState = {
  selections: { query: {}, mutation: {}, subscription: {} },
};

function loadInitialState(): SelectionState {
  try {
    const stored = localStorage.getItem(SELECTION_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return initialState;
}

interface SelectionContextValue {
  state: SelectionState;
  dispatch: React.Dispatch<Action>;
  isSelected: (operationType: OperationType, path: string[]) => boolean;
  getFieldSelection: (
    operationType: OperationType,
    path: string[],
  ) => FieldSelection | null;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    selectionReducer,
    initialState,
    loadInitialState,
  );

  const isSelected = (
    operationType: OperationType,
    path: string[],
  ): boolean => {
    return isFieldSelected(state.selections[operationType] ?? {}, path);
  };

  const getFieldSelection = (
    operationType: OperationType,
    path: string[],
  ): FieldSelection | null => {
    let current = state.selections[operationType] ?? {};
    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      if (!current[segment]) {
        return null;
      }
      if (i === path.length - 1) {
        return current[segment];
      }
      current = current[segment].subFields;
    }
    return null;
  };

  return (
    <SelectionContext.Provider
      value={{ state, dispatch, isSelected, getFieldSelection }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const ctx = useContext(SelectionContext);
  if (!ctx) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return ctx;
}

// Re-export action creators for convenience
export const actions = {
  toggleField: (
    operationType: OperationType,
    path: string[],
    children: SchemaTreeNode[],
  ): Action => ({
    type: "TOGGLE_FIELD",
    operationType,
    path,
    children,
  }),
  setArgument: (
    operationType: OperationType,
    path: string[],
    argName: string,
    value: string,
  ): Action => ({
    type: "SET_ARGUMENT",
    operationType,
    path,
    argName,
    value,
  }),
  clearSelections: (): Action => ({ type: "CLEAR_SELECTIONS" }),
  selectSubtree: (
    operationType: OperationType,
    path: string[],
    fieldNames: string[],
  ): Action => ({
    type: "SELECT_SUBTREE",
    operationType,
    path,
    fieldNames,
  }),
};
