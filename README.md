<div align="center">
  <img src="app-icon.png" alt="Graphman" width="128" />

# Graphman

**See the schema. Check the boxes. Get the query.**

[![GitHub release](https://img.shields.io/github/v/release/muba00/graphman)](https://github.com/muba00/graphman/releases)
[![License](https://img.shields.io/github/license/muba00/graphman?color=green)](LICENSE)
[![macOS / Windows / Linux](https://img.shields.io/badge/os-macOS%20%7C%20Windows%20%7C%20Linux-blue)](#install)

<br />
<img src="screenshot.png" alt="Graphman" width="800" />
</div>

<br />

A desktop GraphQL client that gets out of your way. Paste an endpoint, explore the schema visually, and build queries by selecting fields — no typing required.

## Why Graphman

Most API tools weren't built for GraphQL. You end up writing raw queries against schemas you don't know, guessing field names, and fighting autocomplete.

Graphman takes a different approach: it introspects the endpoint, renders the full schema as a navigable tree, and lets you compose queries by checking boxes. The query updates as you click.

## Features

|                                |                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Schema explorer**            | Introspects your endpoint and displays queries, mutations, and subscriptions as an expandable tree with lazy-loaded children. |
| **Visual query builder**       | Select fields with checkboxes. Arguments, nested objects, and variables are handled automatically.                            |
| **Authorization**              | Bearer token input with show/hide toggle, sent on every request.                                                              |
| **Query runner**               | Execute queries and inspect JSON responses in-app.                                                                            |
| **Syntax-highlighted preview** | Live-updating query preview with copy support.                                                                                |
| **Native & private**           | Built with Tauri (Rust). No Electron, no telemetry, no accounts. Runs entirely on your machine.                               |

## Install

Download the latest release for your platform:

**[Releases →](https://github.com/muba00/graphman/releases)**

| Platform | Format      |
| -------- | ----------- |
| macOS    | `.dmg`      |
| Windows  | `.exe`      |
| Linux    | `.AppImage` |

> **macOS:** After installing, run `xattr -cr /Applications/Graphman.app` in Terminal to clear the quarantine flag.

## Build from source

Requires **Node.js 18+** and **[Rust](https://rustup.rs/)**.

```bash
git clone https://github.com/muba00/graphman.git
cd graphman
npm install
npm run tauri dev     # development
npm run tauri build   # production build
```

## Contributing

Issues and pull requests are welcome on the [issues page](https://github.com/muba00/graphman/issues).
