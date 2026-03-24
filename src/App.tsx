import { QueryBuilderScreen } from "./screens/QueryBuilderScreen";
import { AppProvider } from "./state/appStore";

export default function App() {
  return (
    <AppProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
        }}
      >
        <QueryBuilderScreen />
      </div>
    </AppProvider>
  );
}
