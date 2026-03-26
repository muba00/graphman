#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve } from "path";

const cwd = process.cwd();

// Read version from tauri.conf.json
const tauriConf = JSON.parse(
  readFileSync(resolve(cwd, "src-tauri/tauri.conf.json"), "utf-8")
);
const version = tauriConf.version;
const repo = process.env.GITHUB_REPOSITORY || "muba00/graphman";
const baseUrl = `https://github.com/${repo}/releases/download/v${version}`;

// Scan downloaded .sig files in working directory
const sigFiles = readdirSync(cwd).filter((f) => f.endsWith(".sig"));

if (sigFiles.length === 0) {
  throw new Error("No .sig files found. Cannot generate latest.json.");
}

console.log("Found signature files:", sigFiles);

const platforms = {};

for (const sigFile of sigFiles) {
  const assetName = sigFile.replace(/\.sig$/, "");
  const signature = readFileSync(resolve(cwd, sigFile), "utf-8").trim();
  const entry = { url: `${baseUrl}/${assetName}`, signature };

  if (assetName.endsWith(".app.tar.gz")) {
    // Universal macOS build — register for both architectures
    platforms["darwin-aarch64"] = entry;
    platforms["darwin-x86_64"] = entry;
  } else if (
    assetName.endsWith(".nsis.zip") ||
    assetName.endsWith("x64-setup.exe")
  ) {
    platforms["windows-x86_64"] = entry;
  } else if (assetName.endsWith(".AppImage.tar.gz")) {
    platforms["linux-x86_64"] = entry;
  } else {
    console.warn(`Unknown asset pattern, skipping: ${assetName}`);
  }
}

if (Object.keys(platforms).length === 0) {
  throw new Error("No platforms matched. latest.json would be invalid.");
}

const latest = {
  version,
  notes: `Graphman v${version}`,
  pub_date: new Date().toISOString(),
  platforms,
};

const outPath = resolve(cwd, "latest.json");
writeFileSync(outPath, JSON.stringify(latest, null, 2));
console.log(
  "Generated latest.json with platforms:",
  Object.keys(platforms).join(", ")
);
