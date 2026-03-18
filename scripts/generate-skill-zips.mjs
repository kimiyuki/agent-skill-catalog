import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const skillsDir = path.join(rootDir, "skills");
const outputDir = path.join(rootDir, "public", "downloads");

if (!existsSync(skillsDir)) {
  throw new Error(`Missing skills directory: ${skillsDir}`);
}

mkdirSync(outputDir, { recursive: true });

for (const entry of readdirSync(outputDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".zip")) {
    rmSync(path.join(outputDir, entry.name));
  }
}

const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const slug of skillDirs) {
  const skillMdPath = path.join(skillsDir, slug, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    throw new Error(`Missing SKILL.md for slug "${slug}": ${skillMdPath}`);
  }

  const outputPath = path.join(outputDir, `${slug}.zip`);
  const result = spawnSync("zip", ["-r", "-q", "-X", outputPath, slug], {
    cwd: skillsDir,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = result.stderr?.trim() || result.stdout?.trim() || "zip command failed";
    throw new Error(`Failed to generate archive for "${slug}": ${details}`);
  }
}

console.log(`Generated ${skillDirs.length} skill archive(s) in ${path.relative(rootDir, outputDir)}`);
