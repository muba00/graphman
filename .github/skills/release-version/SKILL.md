---
name: release-version
description: "Workflow for releasing a new version of the Graphman app. Use when the user wants to bump the version, create a release, or publish a new version."
---

# Releasing a New Version

To automatically build and distribute a new release of Graphman across macOS, Linux, and Windows:

1. **Bump Version:** Update the version number in all three of these files — they must all match:
   - `package.json` → `"version"`
   - `src-tauri/tauri.conf.json` → `"version"`
   - `src-tauri/Cargo.toml` → `version` (under `[package]`)
2. **Commit:** Commit the version changes (e.g., `git commit -am "chore: bump version to v1.0.1"`).
3. **Tag:** Create a Git tag starting with "v" (e.g., `git tag v1.0.1`).
4. **Push:** Push the tag to GitHub (`git push origin v1.0.1`).

That's it! GitHub Actions will pick up the new tag, build the app for all platforms, and automatically publish the Release in the GitHub repository.
