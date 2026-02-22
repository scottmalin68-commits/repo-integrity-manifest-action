import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const REPO_ROOT = process.cwd();
const OUTPUT_PATH = path.join(REPO_ROOT, '.governance', 'repo-manifest.json');

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(REPO_ROOT, fullPath);

    if (relPath.startsWith('.git')) continue;
    if (relPath === '.governance/repo-manifest.json') continue;

    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (entry.isFile()) {
      files.push(relPath.replace(/\\/g, '/'));
    }
  }

  return files;
}

function sha256ForFile(relPath) {
  const fullPath = path.join(REPO_ROOT, relPath);
  const data = fs.readFileSync(fullPath);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return { hash, data };
}

function getFileStats(relPath) {
  const fullPath = path.join(REPO_ROOT, relPath);
  const stats = fs.statSync(fullPath);
  const mode = (stats.mode & 0o777).toString(8);
  const isExecutable = !!(stats.mode & 0o111);
  return { size: stats.size, mode, isExecutable };
}

function getMimeType(relPath) {
  try {
    const out = execSync(`file --mime-type -b "${relPath}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    }).trim();
    return out;
  } catch {
    return 'application/octet-stream';
  }
}

function getIgnoreStatus(relPath) {
  try {
    execSync(`git check-ignore "${relPath}"`, {
      cwd: REPO_ROOT,
      stdio: 'pipe'
    });
    return 'ignored';
  } catch {
    try {
      execSync(`git ls-files --error-unmatch "${relPath}"`, {
        cwd: REPO_ROOT,
        stdio: 'pipe'
      });
      return 'tracked';
    } catch {
      return 'untracked';
    }
  }
}

function getLastCommitInfo(relPath) {
  try {
    const format = '%H|%an|%ae|%aI';
    const out = execSync(`git log -1 --format="${format}" -- "${relPath}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    }).trim();
    if (!out) return null;
    const [sha, author, email, timestamp] = out.split('|');
    return { sha, author, email, timestamp };
  } catch {
    return null;
  }
}

function getCreatedAt(relPath) {
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format="%aI" -- "${relPath}" | tail -n 1`,
      { cwd: REPO_ROOT, encoding: 'utf8', shell: '/bin/bash' }
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function getContributorCount(relPath) {
  try {
    const out = execSync(
      `git log --format="%ae" -- "${relPath}" | sort -u | wc -l`,
      { cwd: REPO_ROOT, encoding: 'utf8', shell: '/bin/bash' }
    ).trim();
    const n = parseInt(out, 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

function isLfsTracked(relPath) {
  try {
    const out = execSync(`git lfs track`, {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    });
    return out.includes(relPath);
  } catch {
    return false;
  }
}

function computeEntropy(buffer) {
  const counts = new Array(256).fill(0);
  for (const byte of buffer) counts[byte]++;
  const len = buffer.length || 1;
  let entropy = 0;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

function getRepoInfo() {
  const repo = execSync('git config --get remote.origin.url', {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  }).trim();
  const commitSha = execSync('git rev-parse HEAD', {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  }).trim();
  return { repo, commitSha };
}

function main() {
  if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  }

  const { repo, commitSha } = getRepoInfo();
  const files = walkDir(REPO_ROOT);

  const manifestFiles = files
    .sort()
    .map((relPath) => {
      const { hash, data } = sha256ForFile(relPath);
      const stats = getFileStats(relPath);
      const mimeType = getMimeType(relPath);
      const ignoreStatus = getIgnoreStatus(relPath);
      const lastCommit = getLastCommitInfo(relPath);
      const createdAt = getCreatedAt(relPath);
      const contributorCount = getContributorCount(relPath);
      const lfsTracked = isLfsTracked(relPath);
      const entropy = computeEntropy(data);

      return {
        path: relPath,
        sha256: hash,
        size_bytes: stats.size,
        mime_type: mimeType,
        permissions: stats.mode,
        is_executable: stats.isExecutable,
        is_lfs_tracked: lfsTracked,
        entropy,
        ignore_status: ignoreStatus,
        created_at: createdAt,
        contributor_count: contributorCount,
        last_commit: lastCommit
      };
    });

  const manifest = {
    schema_version: '1.0.0-full',
    generated_at: new Date().toISOString(),
    repository: repo,
    commit_sha: commitSha,
    files: manifestFiles
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Manifest written to ${OUTPUT_PATH}`);
}

main();
