import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("node scripts/e2e-seed.mjs up", { stdio: "inherit" });
}
