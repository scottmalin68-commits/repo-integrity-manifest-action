import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

// Utility: run a shell command and return trimmed output
function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

// Utility: calculate SHA-256 hash of a file
function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Utility: calculate Shannon entropy
function entropy(buffer) {
  const freq = new Array(256).fill(0);
  for (const byte of buffer) freq[byte]++;
  const total = buffer.length;
  return freq.reduce((sum, count) => {
    if (count === 0) return sum;
    const p = count / total;
    return sum - p * Math.log2(p);
  }, 0);
}

// Walk the repository and collect file metadata
function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === ".git" || entry === ".github") continue;
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// MAIN EXECUTION
const repoRoot = process.cwd();
const governanceDir = path.join(repoRoot, ".governance");
if (!fs.existsSync(governanceDir)) fs.mkdirSync(governanceDir);

const files = walk(repoRoot)
  .map((filePath) => {
    const rel = path.relative(repoRoot, filePath);
    const buffer = fs.readFileSync(filePath);

    // Git metadata
    const lastCommit = sh(`git log -1 --pretty=format:"%H|%an|%ae|%ad" -- "${rel}"`).split("|");
    const contributorCount = sh(`git shortlog -s -- "${rel}" | wc -l`);

    return {
      path: rel,
      sha256: sha256(filePath),
      size_bytes: buffer.length,
      mime_type: sh(`file --mime-type -b "${filePath}"`),
      permissions: fs.statSync(filePath).mode.toString(8).slice(-3),
      is_executable: (fs.statSync(filePath).mode & 0o111) !== 0,
      is_lfs_tracked: sh(`git check-attr filter -- "${rel}"`).includes("lfs"),
      entropy: entropy(buffer),
      ignore_status: sh(`git check-ignore "${rel}" && echo ignored || echo tracked`).trim(),
      contributor_count: Number(contributorCount),
      last_commit: {
        sha: lastCommit[0],
        author: lastCommit[1],
        email: lastCommit[2],
        timestamp: lastCommit[3],
      },
    };
  })
  .sort((a, b) => a.path.localeCompare(b.path));

// Build JSON manifest
const jsonManifest = {
  schema_version: "1.0.0-full",
  generated_at: new Date().toISOString(),
  repository: sh("git config --get remote.origin.url"),
  commit_sha: sh("git rev-parse HEAD"),
  files,
};

fs.writeFileSync(
  path.join(governanceDir, "repo-manifest.json"),
  JSON.stringify(jsonManifest, null, 2)
);

// Build Markdown manifest
const mdLines = [];
mdLines.push("# Repository Integrity Manifest (Markdown Version)");
mdLines.push("");
mdLines.push("| Path | SHA‑256 | Size | MIME Type | Entropy | Contributors | Last Commit |");
mdLines.push("|------|---------|------|-----------|---------|--------------|-------------|");

for (const f of files) {
  mdLines.push(
    `| ${f.path} | ${f.sha256.slice(0, 12)}… | ${f.size_bytes} | ${f.mime_type} | ${f.entropy.toFixed(
      2
    )} | ${f.contributor_count} | ${f.last_commit.timestamp} |`
  );
}

fs.writeFileSync(
  path.join(governanceDir, "repo-manifest.md"),
  mdLines.join("\n")
);

console.log("Generated repo-manifest.json and repo-manifest.md");
