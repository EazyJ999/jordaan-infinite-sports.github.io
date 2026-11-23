import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** On a single server, prices and logins live in this folder. Unset on Vercel. */
export function dataDir() {
  const root = process.env.DATA_DIR?.trim();
  return root || null;
}

export async function readDataFile(name: string) {
  const root = dataDir();
  if (!root) return null;
  try {
    return await readFile(join(root, name), "utf8");
  } catch {
    return null;
  }
}

export async function writeDataFile(name: string, body: string) {
  const root = dataDir();
  if (!root) return;
  const path = join(root, name);
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, body);
  await rename(tmp, path);
}
