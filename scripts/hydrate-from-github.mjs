#!/usr/bin/env node
/**
 * On Vercel file-deploys, pull the full repo (images + source) from GitHub
 * before `vite build`. Local `npm run build` never calls this.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const url =
  "https://codeload.github.com/PAPIONCOIN/beabsorventes/tar.gz/refs/heads/main";

execSync(`curl -fsSL "${url}" | tar xz --strip-components=1`, {
  stdio: "inherit",
});

mkdirSync(".grok", { recursive: true });
writeFileSync(
  ".grok/app-env.json",
  `${JSON.stringify(
    { VITE_AUTH_ENABLED: "false", deploy: { database: false } },
    null,
    2,
  )}\n`,
);

console.log("[hydrate] source synced from GitHub");
