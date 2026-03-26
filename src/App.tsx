import { useState, useEffect } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { QueryBuilderScreen } from "./screens/QueryBuilderScreen";
import { AppProvider } from "./state/appStore";
import { UpdateModal } from "./components/UpdateModal";

const UPDATE_CHECK_DELAY_MS = 3000;

export default function App() {
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    downloaded: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const update = await check();
        if (update) {
          setPendingUpdate(update);
        }
      } catch (err) {
        console.error("Failed to check for updates:", err);
      }
    }, UPDATE_CHECK_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  async function handleInstall() {
    if (!pendingUpdate) return;
    setIsInstalling(true);
    let downloaded = 0;
    let total = 0;
    try {
      await pendingUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            setDownloadProgress({ downloaded: 0, total });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setDownloadProgress({ downloaded, total });
            break;
          case "Finished":
            setDownloadProgress(null);
            break;
        }
      });
      await relaunch();
    } catch (err) {
      console.error("Update failed:", err);
      setIsInstalling(false);
      setDownloadProgress(null);
    }
  }

  function handleDismiss() {
    setPendingUpdate(null);
  }

  return (
    <AppProvider>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <QueryBuilderScreen />
        {pendingUpdate && (
          <UpdateModal
            version={pendingUpdate.version}
            releaseNotes={pendingUpdate.body}
            isInstalling={isInstalling}
            progress={downloadProgress}
            onConfirm={handleInstall}
            onDismiss={handleDismiss}
          />
        )}
      </div>
    </AppProvider>
  );
}
