import { execSync } from "node:child_process";

export default function globalTeardown() {
  execSync("node scripts/e2e-seed.mjs down", { stdio: "inherit" });
}
