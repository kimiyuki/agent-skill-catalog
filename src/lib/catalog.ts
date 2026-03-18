import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { marked } from "marked";
import {
  catalogSchema,
  MAX_CATEGORY_VOCAB,
  MAX_SUMMARY_LENGTH,
  MAX_TAG_VOCAB,
  type CatalogMetadata,
} from "./catalog-schema";

const rootDir = process.cwd();
const skillsDir = path.join(rootDir, "skills");
const catalogDir = path.join(rootDir, "catalog");
const githubRepoUrl =
  process.env.PUBLIC_GITHUB_REPO_URL || "https://github.com/kimiyuki/agent-skill-catalog";
const githubBranch = process.env.PUBLIC_GITHUB_BRANCH || "main";

marked.setOptions({
  breaks: true,
  gfm: true,
});

export type CatalogItem = CatalogMetadata & {
  slug: string;
  runtimeName: string;
  runtimeDescription: string;
  body: string;
  bodyHtml: string;
  sourceText: string;
  skillPath: string;
  downloadHref: string;
  sourceHref: string;
  githubSkillDirUrl: string;
  githubSkillMdUrl: string;
  hasScripts: boolean;
  hasAssets: boolean;
};

function listSkillSlugs() {
  if (!existsSync(skillsDir)) {
    return [];
  }
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listCatalogSlugs() {
  if (!existsSync(catalogDir)) {
    return [];
  }
  return readdirSync(catalogDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
    .map((entry) => entry.name.replace(/\.yaml$/, ""))
    .sort();
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function countCharacters(value: string) {
  return Array.from(value).length;
}

function directoryHasChildren(dirPath: string) {
  return existsSync(dirPath) && statSync(dirPath).isDirectory() && readdirSync(dirPath).length > 0;
}

function toGithubBlobUrl(relativePath: string) {
  return `${githubRepoUrl}/blob/${githubBranch}/${relativePath}`;
}

function toGithubTreeUrl(relativePath: string) {
  return `${githubRepoUrl}/tree/${githubBranch}/${relativePath}`;
}

function linkReferencePaths(body: string, slug: string) {
  return body.replace(/`(references\/[^`\n]+?\.md)`/g, (_match, relativeReferencePath: string) => {
    const absoluteReferencePath = path.join(skillsDir, slug, relativeReferencePath);
    if (!existsSync(absoluteReferencePath)) {
      return `\`${relativeReferencePath}\``;
    }
    return `[\`${relativeReferencePath}\`](${toGithubBlobUrl(`skills/${slug}/${relativeReferencePath}`)})`;
  });
}

function loadSkillRuntime(slug: string) {
  const skillPath = path.join(skillsDir, slug, "SKILL.md");
  const source = readFileSync(skillPath, "utf8");
  const parsed = matter(source);
  const runtimeName = typeof parsed.data.name === "string" ? parsed.data.name.trim() : "";
  const runtimeDescription =
    typeof parsed.data.description === "string" ? parsed.data.description.trim() : "";
  const body = parsed.content.trim().replace(/^#\s+.+\n+/, "");
  const linkedBody = linkReferencePaths(body, slug);
  return {
    skillPath,
    sourceText: source,
    runtimeName,
    runtimeDescription,
    body,
    bodyHtml: marked.parse(linkedBody) as string,
  };
}

function loadCatalogMetadata(slug: string) {
  const filePath = path.join(catalogDir, `${slug}.yaml`);
  const parsed = yaml.load(readFileSync(filePath, "utf8"));
  return catalogSchema.parse(parsed);
}

export function validateCatalog() {
  const errors: string[] = [];
  const skillSlugs = listSkillSlugs();
  const catalogSlugs = listCatalogSlugs();

  const duplicateSkillSlugs = skillSlugs.filter((slug, index) => skillSlugs.indexOf(slug) !== index);
  const duplicateCatalogSlugs = catalogSlugs.filter(
    (slug, index) => catalogSlugs.indexOf(slug) !== index,
  );

  for (const slug of duplicateSkillSlugs) {
    errors.push(`duplicate skill slug: ${slug}`);
  }
  for (const slug of duplicateCatalogSlugs) {
    errors.push(`duplicate catalog slug: ${slug}`);
  }

  for (const slug of skillSlugs) {
    const skillPath = path.join("skills", slug, "SKILL.md");
    if (!existsSync(path.join(rootDir, skillPath))) {
      errors.push(`missing skill file for slug "${slug}": ${skillPath}`);
      continue;
    }

    try {
      const runtime = loadSkillRuntime(slug);
      if (!runtime.runtimeName) {
        errors.push(`missing name in ${skillPath}`);
      }
      if (!runtime.runtimeDescription) {
        errors.push(`missing description in ${skillPath}`);
      }
    } catch (error) {
      errors.push(`failed to parse ${skillPath}: ${error instanceof Error ? error.message : String(error)}`);
    }

    const catalogPath = path.join("catalog", `${slug}.yaml`);
    if (!existsSync(path.join(rootDir, catalogPath))) {
      errors.push(`missing catalog metadata for slug "${slug}": ${catalogPath}`);
      continue;
    }

    try {
      const metadata = loadCatalogMetadata(slug);
      if (!metadata.title.trim()) {
        errors.push(`empty title in ${catalogPath}`);
      }
      if (!metadata.summary.trim()) {
        errors.push(`empty summary in ${catalogPath}`);
      }
      if (countCharacters(metadata.summary) > MAX_SUMMARY_LENGTH) {
        errors.push(
          `summary too long in ${catalogPath}: ${countCharacters(metadata.summary)} chars (max ${MAX_SUMMARY_LENGTH})`,
        );
      }
      if (!isValidDateString(metadata.lastValidated)) {
        errors.push(`invalid lastValidated in ${catalogPath}: ${metadata.lastValidated}`);
      }
    } catch (error) {
      errors.push(`invalid catalog metadata in ${catalogPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const slug of catalogSlugs) {
    const skillPath = path.join("skills", slug, "SKILL.md");
    if (!existsSync(path.join(rootDir, skillPath))) {
      errors.push(`orphan catalog metadata without skill: catalog/${slug}.yaml -> ${skillPath}`);
    }
  }

  const categorySet = new Set<string>();
  const tagSet = new Set<string>();
  for (const slug of catalogSlugs) {
    try {
      const metadata = loadCatalogMetadata(slug);
      categorySet.add(metadata.category);
      for (const tag of metadata.tags) {
        tagSet.add(tag);
      }
    } catch {
      // Already reported above.
    }
  }

  if (categorySet.size > MAX_CATEGORY_VOCAB) {
    errors.push(
      `too many categories: ${categorySet.size} (max ${MAX_CATEGORY_VOCAB}) -> ${Array.from(categorySet).sort().join(", ")}`,
    );
  }

  if (tagSet.size > MAX_TAG_VOCAB) {
    errors.push(`too many tags: ${tagSet.size} (max ${MAX_TAG_VOCAB}) -> ${Array.from(tagSet).sort().join(", ")}`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidCatalog() {
  const result = validateCatalog();
  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }
}

export function loadCatalogItems() {
  assertValidCatalog();
  const items: CatalogItem[] = listSkillSlugs().map((slug) => {
    const runtime = loadSkillRuntime(slug);
    const metadata = loadCatalogMetadata(slug);
    return {
      slug,
      ...metadata,
      runtimeName: runtime.runtimeName,
      runtimeDescription: runtime.runtimeDescription,
      body: runtime.body,
      bodyHtml: runtime.bodyHtml,
      sourceText: runtime.sourceText,
      skillPath: `skills/${slug}/SKILL.md`,
      downloadHref: `/downloads/${slug}.zip`,
      sourceHref: `/source/${slug}.md`,
      githubSkillDirUrl: toGithubTreeUrl(`skills/${slug}`),
      githubSkillMdUrl: toGithubBlobUrl(`skills/${slug}/SKILL.md`),
      hasScripts: directoryHasChildren(path.join(skillsDir, slug, "scripts")),
      hasAssets: directoryHasChildren(path.join(skillsDir, slug, "assets")),
    };
  });

  return items.sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    if (left.lastValidated !== right.lastValidated) {
      return right.lastValidated.localeCompare(left.lastValidated);
    }
    return left.title.localeCompare(right.title, "ja");
  });
}

export function getCatalogItem(slug: string) {
  return loadCatalogItems().find((item) => item.slug === slug);
}
