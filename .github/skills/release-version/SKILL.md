---
name: release-version
description: "Workflow for releasing a new version of the GraphMan app. Use when the user wants to bump the version, create a release, or publish a new version."
---

# Releasing a New Version

To automatically build and distribute a new release of GraphMan across macOS, Linux, and Windows:

1. **Bump Version:** Update the version number in both `package.json` and `src-tauri/tauri.conf.json`.
2. **Commit:** Commit the version changes (e.g., `git commit -am "chore: bump version to v1.0.1"`).
3. **Tag:** Create a Git tag starting with "v" (e.g., `git tag v1.0.1`).
4. **Push:** Push the tag to GitHub (`git push origin v1.0.1`).

That's it! GitHub Actions will pick up the new tag, build the app for all platforms, and create a draft Release in the GitHub repository. Go to the Releases page, review it, and click "Publish" to make it public.
