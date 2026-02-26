#!/usr/bin/env node
/**
 * Pre-generates NativeWind's Tailwind CSS output for web so that
 * `expo export -p web` can resolve node_modules/.cache/nativewind/global.css.
 * Required for CI (e.g. Netlify) where the cache is empty on first run.
 */
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const cacheDir = path.join(projectRoot, "node_modules", ".cache", "nativewind");
const outputFile = path.join(cacheDir, "global.css.web.css");

fs.mkdirSync(cacheDir, { recursive: true });

execSync(
  `npx tailwindcss -c tailwind.config.js -i ./global.css -o "${outputFile}"`,
  {
    cwd: projectRoot,
    stdio: "inherit",
  }
);
