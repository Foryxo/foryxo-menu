import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const isRootExport =
  process.env.STATIC_ROOT_EXPORT === "true" || process.argv.includes("--root");
const exportBasePath = isRootExport ? "" : "/foryxo-menu";
const exportSiteUrl = isRootExport
  ? process.env.STATIC_SITE_URL || "https://foryxo-menu.pages.dev"
  : "https://foryxo.github.io/foryxo-menu";
const backupRoot = path.join(root, ".pages-build-backup");
const disabledPaths = [
  "src/app/api",
  "src/app/menus",
  "src/app/orders",
  "src/app/q",
  "src/app/mock-gateway",
  "src/app/indexnow-key",
  "src/app/llms.txt",
  "src/app/[locale]/admin",
  "src/app/[locale]/creator",
  "src/app/[locale]/dashboard",
  "src/app/[locale]/status",
  "src/app/[locale]/not-found.tsx",
  "src/app/[locale]/login",
  "src/app/[locale]/register",
  "src/proxy.ts",
];
const disabled = disabledPaths.map((relativePath, index) => [
  path.join(root, relativePath),
  path.join(backupRoot, String(index)),
]);

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function run(command, args, env) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      shell: true,
      stdio: "inherit",
    });
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with ${code}`)),
    );
    child.on("error", reject);
  });
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}

async function pruneOptimizedImageSources(outputRoot) {
  const imageRoots = [
    path.join(outputRoot, "images", "demos"),
    path.join(outputRoot, "images", "generated"),
  ];
  let removed = 0;
  for (const imageRoot of imageRoots) {
    if (!(await exists(imageRoot))) continue;
    for (const file of await walk(imageRoot)) {
      if (path.extname(file).toLowerCase() !== ".png") continue;
      const optimized = `${file.slice(0, -4)}.webp`;
      if (!(await exists(optimized))) continue;
      await unlink(file);
      removed += 1;
    }
  }
  console.log(`Removed ${removed} redundant PNG source files from the deploy artifact.`);
}

await rm(backupRoot, { recursive: true, force: true });
await mkdir(backupRoot, { recursive: true });

try {
  for (const [source, destination] of disabled) {
    if (await exists(source)) await rename(source, destination);
  }
  await rm(path.join(root, ".next"), { recursive: true, force: true });
  await rm(path.join(root, "out"), { recursive: true, force: true });
  await run("npm", ["run", "build"], {
    ...process.env,
    GITHUB_PAGES: isRootExport ? "false" : "true",
    STATIC_EXPORT: "true",
    NEXT_PUBLIC_BASE_PATH: exportBasePath,
    NEXT_PUBLIC_SITE_URL: exportSiteUrl,
    APP_URL: exportSiteUrl,
    FORYXO_SKIP_BUILD_TYPECHECK: "1",
  });

  const outputRoot = path.join(root, "out");
  const textExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".txt",
    ".xml",
    ".webmanifest",
  ]);
  for (const file of await walk(outputRoot)) {
    if (!textExtensions.has(path.extname(file))) continue;
    const input = await readFile(file, "utf8");
    const output = exportBasePath
      ? input
          .replaceAll('"/logo.png', `"${exportBasePath}/logo.png`)
          .replaceAll("'/logo.png", `'${exportBasePath}/logo.png`)
          .replaceAll('"/theme/', `"${exportBasePath}/theme/`)
          .replaceAll("'/theme/", `'${exportBasePath}/theme/`)
          .replaceAll('"/images/', `"${exportBasePath}/images/`)
          .replaceAll("'/images/", `'${exportBasePath}/images/`)
          .replaceAll('url("/images/', `url("${exportBasePath}/images/`)
          .replaceAll("url('/images/", `url('${exportBasePath}/images/`)
          .replaceAll("url(/images/", `url(${exportBasePath}/images/`)
          .replaceAll('url("/fonts/', `url("${exportBasePath}/fonts/`)
          .replaceAll("url('/fonts/", `url('${exportBasePath}/fonts/`)
          .replaceAll("url(/fonts/", `url(${exportBasePath}/fonts/`)
      : input;
    if (output !== input) await writeFile(file, output);
  }
  await pruneOptimizedImageSources(outputRoot);
  await writeFile(path.join(outputRoot, ".nojekyll"), "");
} finally {
  for (let index = disabled.length - 1; index >= 0; index -= 1) {
    const [source, destination] = disabled[index];
    if (await exists(destination)) {
      await mkdir(path.dirname(source), { recursive: true });
      await rename(destination, source);
    }
  }
  await rm(backupRoot, { recursive: true, force: true });
}
