import { defineConfig } from "astro/config";

const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY || "").split("/");
const site = process.env.SITE_URL || (owner && repo ? `https://${owner}.github.io/${repo}` : "http://localhost:4321");
const base = process.env.SITE_BASE || (process.env.GITHUB_ACTIONS === "true" && repo ? `/${repo}` : "/");

export default defineConfig({
  site,
  base,
});

