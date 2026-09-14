import { resolve } from "node:path";
import { rmSync } from "node:fs";
import { env } from "../src/config/env";

if (env.DB_DRIVER !== "pglite") {
  console.error("db:reset only supports the PGLite development driver.");
  process.exit(1);
}
const dir = resolve(process.cwd(), env.DATA_DIR, "pglite");
rmSync(dir, { recursive: true, force: true });
console.log("✓ PGLite data cleared:", dir);
