import React, { createContext, useContext, useReducer, ReactNode } from "react";

export interface AppState {
  lastEndpoint: string;
}

type Action = { type: "SET_LAST_ENDPOINT"; payload: string };

const initialState: AppState = {
  lastEndpoint: "",
};

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(
  undefined,
);

const APP_STATE_KEY = "graphman_app_state";

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  switch (action.type) {
    case "SET_LAST_ENDPOINT":
      newState = { ...state, lastEndpoint: action.payload };
      break;
    default:
      return state;
  }

  // Persist the entire app state gracefully
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(newState));
  return newState;
}

function loadInitialState(): AppState {
  try {
    const stored = localStorage.getItem(APP_STATE_KEY);
    if (stored) {
      return { ...initialState, ...JSON.parse(stored) };
    }
    // Fallback block for the older direct storage we temporarily added
    const oldEndpoint = localStorage.getItem("graphman_last_endpoint");
    if (oldEndpoint) {
      return { ...initialState, lastEndpoint: oldEndpoint };
    }
  } catch {
    // If JSON.parse fails, continue with initial state
  }
  return initialState;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error("useAppDispatch must be used within an AppProvider");
  }
  return context;
}
