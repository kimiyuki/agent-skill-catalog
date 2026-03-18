import { validateCatalog } from "../src/lib/catalog";

const result = validateCatalog();

if (!result.ok) {
  console.error("Skill catalog validation failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Skill catalog validation passed.");

