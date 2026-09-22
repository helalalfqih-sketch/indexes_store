/* eslint-disable prettier/prettier */
const GITHUB_API = "https://api.github.com";
const REPOSITORY = "helalalfqih-sketch/indexes_store";
const DEFAULT_BRANCH = "main";
const MAX_FILE_BYTES = 200_000;
const MAX_SEARCH_RESULTS = 50;
const MAX_PUBLIC_SEARCH_FILES = 500;
const PUBLIC_SEARCH_BATCH = 32;

type GitHubFile = {
  type?: string;
  path?: string;
  sha?: string;
  size?: number;
  encoding?: string;
  content?: string;
  download_url?: string | null;
};

function githubToken() {
  return process.env.STORE_MCP_GITHUB_TOKEN?.trim() || null;
}

function safePath(value: string) {
  const path = value.trim().replace(/^\/+/, "");
  if (
    !path ||
    path.length > 240 ||
    path.includes("..") ||
    /(^|\/)(\.env|\.vercel|node_modules|\.git)(\/|$)/i.test(path) ||
    /(secret|credential|private[-_.]?key|service[-_.]?role)/i.test(path)
  ) {
    throw new Error("UNSAFE_PATH");
  }
  return path;
}

function safeBranch(value: string) {
  const branch = value.trim();
  if (
    !/^agent\/[a-z0-9][a-z0-9._/-]{2,80}$/i.test(branch) ||
    branch === DEFAULT_BRANCH ||
    branch.includes("..") ||
    branch.endsWith("/")
  ) {
    throw new Error("UNSAFE_BRANCH");
  }
  return branch;
}

async function github(path: string, init: RequestInit = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const token = githubToken();
  if (method !== "GET" && !token) {
    throw new Error("STORE_MCP_GITHUB_WRITE_NOT_CONFIGURED");
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) throw new Error(`GITHUB_${response.status}`);
  return data;
}

type GitTreeEntry = {
  type?: string;
  path?: string;
  sha?: string;
  size?: number;
};

async function searchPublicSource(term: string, limit: number) {
  const tree = (await github(
    `/repos/${REPOSITORY}/git/trees/${encodeURIComponent(DEFAULT_BRANCH)}?recursive=1`,
  )) as { tree?: GitTreeEntry[]; truncated?: boolean };

  const allowedExtension = /\.(?:ts|tsx|js|jsx|json|css|md|yml|yaml)$/i;
  const candidates = (tree.tree ?? [])
    .filter(
      (entry) =>
        entry.type === "blob" &&
        typeof entry.path === "string" &&
        allowedExtension.test(entry.path) &&
        (entry.size ?? 0) <= MAX_FILE_BYTES &&
        !/(^|\/)(node_modules|dist|build|\.git|\.vercel)(\/|$)/i.test(entry.path),
    )
    .sort((a, b) => {
      const score = (entry: GitTreeEntry) => {
        const p = String(entry.path ?? "").toLowerCase();
        let value = 0;
        if (p.startsWith("src/routes/")) value += 5;
        if (p.startsWith("src/components/")) value += 5;
        if (p.startsWith("src/lib/")) value += 4;
        if (p.includes(term.toLowerCase())) value += 10;
        return value;
      };
      return score(b) - score(a);
    })
    .slice(0, MAX_PUBLIC_SEARCH_FILES);

  const needle = term.toLowerCase();
  const matches: Array<Record<string, unknown>> = [];

  for (let start = 0; start < candidates.length && matches.length < limit; start += PUBLIC_SEARCH_BATCH) {
    const batch = candidates.slice(start, start + PUBLIC_SEARCH_BATCH);
    const inspected = await Promise.all(
      batch.map(async (entry) => {
        const rawUrl = `https://raw.githubusercontent.com/${REPOSITORY}/${DEFAULT_BRANCH}/${String(entry.path)
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`;
        try {
          const response = await fetch(rawUrl, { headers: { Accept: "text/plain" } });
          if (!response.ok) return null;
          const text = await response.text();
          if (!text.toLowerCase().includes(needle)) return null;
          const path = String(entry.path);
          return {
            name: path.split("/").pop(),
            path,
            sha: entry.sha,
            html_url: `https://github.com/${REPOSITORY}/blob/${DEFAULT_BRANCH}/${path}`,
          };
        } catch {
          return null;
        }
      }),
    );
    for (const item of inspected) {
      if (item) matches.push(item);
      if (matches.length >= limit) break;
    }
  }

  return {
    total_count: matches.length,
    items: matches,
    search_mode: "public-repository-fallback",
    scanned_files: candidates.length,
    truncated: Boolean(tree.truncated) || candidates.length >= MAX_PUBLIC_SEARCH_FILES,
  };
}

async function searchSource(term: string, limit = MAX_SEARCH_RESULTS) {
  const token = githubToken();
  if (token) {
    return (await github(
      `/search/code?q=${encodeURIComponent(`${term} repo:${REPOSITORY}`)}&per_page=${limit}`,
    )) as {
      total_count?: number;
      items?: Array<Record<string, unknown>>;
      search_mode?: string;
      scanned_files?: number;
      truncated?: boolean;
    };
  }
  return searchPublicSource(term, limit);
}

function decodeFile(file: GitHubFile) {
  if (file.type !== "file" || file.encoding !== "base64" || typeof file.content !== "string") {
    throw new Error("FILE_UNAVAILABLE");
  }
  if ((file.size ?? 0) > MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
  return Buffer.from(file.content.split("\n").join(""), "base64").toString("utf8");
}

export interface StoreDevelopmentAdapter {
  repositoryInfo(): Promise<Record<string, unknown>>;
  readFile(path: string, ref: string): Promise<Record<string, unknown>>;
  searchCode(query: string): Promise<Record<string, unknown>>;
  createBranch(branch: string, base: string): Promise<Record<string, unknown>>;
  patchFile(input: {
    branch: string;
    path: string;
    expectedSha: string;
    content: string;
    message: string;
  }): Promise<Record<string, unknown>>;
  createPullRequest(input: {
    branch: string;
    title: string;
    body: string;
  }): Promise<Record<string, unknown>>;
  traceElement(input: {
    text?: string;
    testId?: string;
    href?: string;
    elementId?: string;
  }): Promise<Record<string, unknown>>;
  inspectPullRequest(branch: string): Promise<Record<string, unknown>>;
  releaseReadiness(input: {
    branch: string;
    expectedHeadSha: string;
  }): Promise<Record<string, unknown>>;
  inspectProduction(): Promise<Record<string, unknown>>;
}

export function createStoreDevelopmentAdapter(): StoreDevelopmentAdapter {
  return {
    async repositoryInfo() {
      const repo = (await github(`/repos/${REPOSITORY}`)) as Record<string, unknown>;
      const writeConfigured = Boolean(githubToken());
      return {
        repository: REPOSITORY,
        defaultBranch: repo.default_branch,
        private: repo.private,
        htmlUrl: repo.html_url,
        sourceReadConfigured: true,
        sourceReadMode: writeConfigured ? "authenticated-github-api" : "public-github-api",
        sourceWriteConfigured: writeConfigured,
        writeBlocker: writeConfigured ? null : "SOURCE_GITHUB_WRITE_NOT_CONFIGURED",
        mode: "branch-and-pr-only",
        directMainWrites: false,
        secretsReadable: false,
      };
    },

    async readFile(path, ref) {
      const safe = safePath(path);
      const branch = ref === DEFAULT_BRANCH ? DEFAULT_BRANCH : safeBranch(ref);
      const file = (await github(
        `/repos/${REPOSITORY}/contents/${safe.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`,
      )) as GitHubFile;
      return {
        repository: REPOSITORY,
        ref: branch,
        path: safe,
        sha: file.sha,
        size: file.size,
        content: decodeFile(file),
      };
    },

    async searchCode(query) {
      const term = query.trim();
      if (!term || term.length > 120) throw new Error("INVALID_QUERY");
      const data = await searchSource(term, MAX_SEARCH_RESULTS);
      return {
        repository: REPOSITORY,
        query: term,
        total: data.total_count ?? 0,
        searchMode: data.search_mode ?? (githubToken() ? "authenticated-code-search" : "public-repository-fallback"),
        scannedFiles: data.scanned_files ?? null,
        truncated: data.truncated ?? false,
        results: (data.items ?? []).slice(0, MAX_SEARCH_RESULTS).map((item) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          htmlUrl: item.html_url,
        })),
      };
    },

    async createBranch(branch, base) {
      const safe = safeBranch(branch);
      if (base !== DEFAULT_BRANCH) throw new Error("BASE_BRANCH_FORBIDDEN");
      const ref = (await github(
        `/repos/${REPOSITORY}/git/ref/heads/${encodeURIComponent(DEFAULT_BRANCH)}`,
      )) as { object?: { sha?: string } };
      const sha = ref.object?.sha;
      if (!sha) throw new Error("BASE_SHA_UNAVAILABLE");
      await github(`/repos/${REPOSITORY}/git/refs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: `refs/heads/${safe}`, sha }),
      });
      return { repository: REPOSITORY, branch: safe, base: DEFAULT_BRANCH, baseSha: sha };
    },

    async patchFile(input) {
      const branch = safeBranch(input.branch);
      const path = safePath(input.path);
      if (!input.expectedSha || input.expectedSha.length > 80)
        throw new Error("EXPECTED_SHA_REQUIRED");
      if (!input.content || Buffer.byteLength(input.content, "utf8") > MAX_FILE_BYTES) {
        throw new Error("INVALID_CONTENT");
      }
      const message = input.message.trim();
      if (!message || message.length > 120) throw new Error("INVALID_COMMIT_MESSAGE");
      const data = (await github(
        `/repos/${REPOSITORY}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            content: Buffer.from(input.content, "utf8").toString("base64"),
            sha: input.expectedSha,
            branch,
          }),
        },
      )) as { commit?: { sha?: string }; content?: { sha?: string } };
      return {
        repository: REPOSITORY,
        branch,
        path,
        commitSha: data.commit?.sha,
        contentSha: data.content?.sha,
      };
    },

    async traceElement(input) {
      const terms = [
        input.testId?.trim(),
        input.elementId?.trim(),
        input.href?.trim(),
        input.text?.trim(),
      ].filter((value): value is string => Boolean(value && value.length >= 2));
      if (!terms.length) throw new Error("TRACE_SIGNAL_REQUIRED");

      const unique = [...new Set(terms)].slice(0, 4);
      const matches = new Map<string, Record<string, unknown>>();
      for (const term of unique) {
        const data = await searchSource(term, 20);
        for (const item of data.items ?? []) {
          const path = String(item.path ?? "");
          if (!path || matches.has(path)) continue;
          matches.set(path, {
            path,
            name: item.name,
            sha: item.sha,
            htmlUrl: item.html_url,
            matchedSignal: term,
          });
        }
      }

      const ranked = [...matches.values()]
        .map((item) => {
          const path = String(item.path ?? "");
          let score = 0;
          if (path.startsWith("src/components/") || path.startsWith("src/routes/")) score += 4;
          if (path.endsWith(".tsx") || path.endsWith(".ts")) score += 3;
          const loweredPath = path.toLowerCase();
          if (["test", "spec", "docs", "migration"].some((part) => loweredPath.includes(part))) {
            score -= 3;
          }
          return { ...item, score };
        })
        .sort((a, b) => Number(b.score) - Number(a.score))
        .slice(0, 20);

      return {
        repository: REPOSITORY,
        signals: unique,
        candidates: ranked,
        note:
          "Candidates are source-search evidence, not a guaranteed component mapping. Read the top files before patching.",
      };
    },

    async inspectPullRequest(branch) {
      const safe = safeBranch(branch);
      const pulls = (await github(
        `/repos/${REPOSITORY}/pulls?state=open&head=${encodeURIComponent(`helalalfqih-sketch:${safe}`)}&base=${DEFAULT_BRANCH}&per_page=5`,
      )) as Array<Record<string, unknown>>;
      const pull = pulls[0];
      if (!pull) return { repository: REPOSITORY, branch: safe, found: false };

      const number = Number(pull.number);
      const [files, checks] = await Promise.all([
        github(`/repos/${REPOSITORY}/pulls/${number}/files?per_page=100`) as Promise<
          Array<Record<string, unknown>>
        >,
        github(`/repos/${REPOSITORY}/commits/${String((pull.head as { sha?: string })?.sha ?? "")}/check-runs`) as Promise<{
          check_runs?: Array<Record<string, unknown>>;
        }>,
      ]);
      const checkRuns = checks.check_runs ?? [];
      return {
        repository: REPOSITORY,
        branch: safe,
        found: true,
        pullRequest: {
          number,
          url: pull.html_url,
          draft: pull.draft,
          mergeable: pull.mergeable,
          mergeableState: pull.mergeable_state,
          headSha: (pull.head as { sha?: string })?.sha,
          baseSha: (pull.base as { sha?: string })?.sha,
        },
        files: files.map((file) => ({
          path: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        })),
        checks: checkRuns.map((check) => ({
          name: check.name,
          status: check.status,
          conclusion: check.conclusion,
          detailsUrl: check.details_url,
        })),
        allCompleted: checkRuns.length > 0 && checkRuns.every((check) => check.status === "completed"),
        allSuccessful:
          checkRuns.length > 0 &&
          checkRuns.every((check) => ["success", "neutral", "skipped"].includes(String(check.conclusion))),
      };
    },

    async releaseReadiness(input) {
      const safe = safeBranch(input.branch);
      const normalizedHeadSha = input.expectedHeadSha.toLowerCase();
      if (
        normalizedHeadSha.length !== 40 ||
        [...normalizedHeadSha].some((char) => !"0123456789abcdef".includes(char))
      ) {
        throw new Error("EXPECTED_HEAD_SHA_REQUIRED");
      }
      const pulls = (await github(
        `/repos/${REPOSITORY}/pulls?state=open&head=${encodeURIComponent(`helalalfqih-sketch:${safe}`)}&base=${DEFAULT_BRANCH}&per_page=5`,
      )) as Array<Record<string, unknown>>;
      const pull = pulls[0];
      if (!pull) return { repository: REPOSITORY, branch: safe, ready: false, reason: "PR_NOT_FOUND" };

      const headSha = String((pull.head as { sha?: string })?.sha ?? "");
      if (headSha !== input.expectedHeadSha) {
        return {
          repository: REPOSITORY,
          branch: safe,
          ready: false,
          reason: "HEAD_SHA_CHANGED",
          expectedHeadSha: input.expectedHeadSha,
          actualHeadSha: headSha,
        };
      }

      const checks = (await github(`/repos/${REPOSITORY}/commits/${headSha}/check-runs`)) as {
        check_runs?: Array<Record<string, unknown>>;
      };
      const statuses = (await github(`/repos/${REPOSITORY}/commits/${headSha}/status`)) as {
        state?: string;
        statuses?: Array<Record<string, unknown>>;
      };
      const checkRuns = checks.check_runs ?? [];
      const completed = checkRuns.length > 0 && checkRuns.every((check) => check.status === "completed");
      const successful =
        completed &&
        checkRuns.every((check) =>
          ["success", "neutral", "skipped"].includes(String(check.conclusion)),
        );
      const combinedSuccess = statuses.state === "success";
      const mergeable = pull.mergeable === true && String(pull.mergeable_state) === "clean";

      return {
        repository: REPOSITORY,
        branch: safe,
        ready: successful && combinedSuccess && mergeable,
        headSha,
        pullRequest: {
          number: pull.number,
          url: pull.html_url,
          draft: pull.draft,
          mergeable: pull.mergeable,
          mergeableState: pull.mergeable_state,
        },
        gates: {
          checksCompleted: completed,
          checksSuccessful: successful,
          combinedStatus: statuses.state ?? "unknown",
          mergeableClean: mergeable,
        },
        blockers: [
          !completed ? "CHECKS_NOT_COMPLETE" : null,
          completed && !successful ? "CHECKS_FAILED" : null,
          !combinedSuccess ? "COMBINED_STATUS_NOT_SUCCESS" : null,
          !mergeable ? "PR_NOT_CLEAN" : null,
        ].filter(Boolean),
        note:
          "Readiness is advisory and SHA-bound. This V2 connector still cannot merge or deploy.",
      };
    },

    async inspectProduction() {
      const branch = (await github(`/repos/${REPOSITORY}/branches/${DEFAULT_BRANCH}`)) as {
        commit?: { sha?: string };
        protected?: boolean;
      };
      const headSha = branch.commit?.sha;
      if (!headSha) throw new Error("MAIN_SHA_UNAVAILABLE");

      const [checks, status, commit] = await Promise.all([
        github(`/repos/${REPOSITORY}/commits/${headSha}/check-runs`) as Promise<{
          check_runs?: Array<Record<string, unknown>>;
        }>,
        github(`/repos/${REPOSITORY}/commits/${headSha}/status`) as Promise<{
          state?: string;
          statuses?: Array<Record<string, unknown>>;
        }>,
        github(`/repos/${REPOSITORY}/commits/${headSha}`) as Promise<Record<string, unknown>>,
      ]);
      const checkRuns = checks.check_runs ?? [];
      return {
        repository: REPOSITORY,
        branch: DEFAULT_BRANCH,
        headSha,
        protected: branch.protected ?? null,
        commit: {
          url: commit.html_url,
          message: (commit.commit as { message?: string })?.message?.split("\n")[0] ?? null,
        },
        checks: checkRuns.map((check) => ({
          name: check.name,
          status: check.status,
          conclusion: check.conclusion,
          detailsUrl: check.details_url,
        })),
        checksCompleted: checkRuns.length > 0 && checkRuns.every((check) => check.status === "completed"),
        checksSuccessful:
          checkRuns.length > 0 &&
          checkRuns.every((check) =>
            ["success", "neutral", "skipped"].includes(String(check.conclusion)),
          ),
        combinedStatus: status.state ?? "unknown",
        inspectionMode: "read-only-production-verification",
      };
    },

    async createPullRequest(input) {
      const branch = safeBranch(input.branch);
      const title = input.title.trim();
      if (!title || title.length > 120) throw new Error("INVALID_PR_TITLE");
      const body = input.body.trim().slice(0, 10_000);
      const data = (await github(`/repos/${REPOSITORY}/pulls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          head: branch,
          base: DEFAULT_BRANCH,
          draft: true,
        }),
      })) as { number?: number; html_url?: string; state?: string; draft?: boolean };
      return {
        repository: REPOSITORY,
        number: data.number,
        url: data.html_url,
        state: data.state,
        draft: data.draft,
      };
    },
  };
}
