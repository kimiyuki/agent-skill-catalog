import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const stagedOnly = args.has("--staged");

const patterns = [
  { label: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { label: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { label: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: "OpenAI key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { label: "AWS access key", regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { label: "Google API key", regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { label: "Private key", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { label: "Bearer token in URL", regex: /\baccess_token=[A-Za-z0-9._-]{10,}\b/gi },
  { label: "Basic auth URL", regex: /https?:\/\/[^/\s:@]+:[^/\s@]+@/g },
];

function listFiles() {
  const command = stagedOnly
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR"]
    : ["ls-files", "--cached", "--others", "--exclude-standard"];
  const output = execFileSync("git", command, { encoding: "utf8" }).trim();
  return output ? output.split("\n").filter(Boolean) : [];
}

function isBinary(buffer) {
  return buffer.includes(0);
}

const hits = [];
for (const file of listFiles()) {
  let buffer;
  try {
    buffer = readFileSync(file);
  } catch {
    continue;
  }
  if (isBinary(buffer)) {
    continue;
  }
  const text = buffer.toString("utf8");
  for (const { label, regex } of patterns) {
    regex.lastIndex = 0;
    const match = regex.exec(text);
    if (match) {
      hits.push({ file, label, sample: match[0].slice(0, 32) });
    }
  }
}

if (hits.length > 0) {
  console.error("Credential-like strings detected:");
  for (const hit of hits) {
    console.error(`- ${hit.file}: ${hit.label} (${hit.sample}...)`);
  }
  process.exit(1);
}

console.log(`Secret check passed (${stagedOnly ? "staged files" : "repo files"}).`);
