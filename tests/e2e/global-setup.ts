import { execSync } from "node:child_process";

export default function globalSetup() {
  if (process.env.E2E_SKIP_AUTH === "1" || process.env.E2E_AUTH_STATE) return;
  execSync("node scripts/e2e-seed.mjs up", { stdio: "inherit" });
}
