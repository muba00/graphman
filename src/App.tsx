import { QueryBuilderScreen } from "./screens/QueryBuilderScreen";

export default function App() {
  return (
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
  );
}
