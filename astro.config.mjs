import { defineConfig } from "astro/config";

const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY || "").split("/");
const site = process.env.SITE_URL || (owner && repo ? `https://${owner}.github.io/${repo}` : "http://localhost:4321");

function normalizeBase(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

const base = normalizeBase(
  process.env.SITE_BASE || (process.env.GITHUB_ACTIONS === "true" && repo ? `/${repo}` : "/"),
);

export default defineConfig({
  site,
  base,
});
