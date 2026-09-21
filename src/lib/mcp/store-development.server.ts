/* eslint-disable prettier/prettier */
const GITHUB_API = "https://api.github.com";
const REPOSITORY = "helalalfqih-sketch/indexes_store";
const DEFAULT_BRANCH = "main";
const MAX_FILE_BYTES = 200_000;
const MAX_SEARCH_RESULTS = 50;

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
  const token = process.env.STORE_MCP_GITHUB_TOKEN?.trim();
  if (!token) throw new Error("STORE_MCP_GITHUB_NOT_CONFIGURED");
  return token;
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
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) throw new Error(`GITHUB_${response.status}`);
  return data;
}

function decodeFile(file: GitHubFile) {
  if (file.type !== "file" || file.encoding !== "base64" || typeof file.content !== "string") {
    throw new Error("FILE_UNAVAILABLE");
  }
  if ((file.size ?? 0) > MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
  return Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
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
}

export function createStoreDevelopmentAdapter(): StoreDevelopmentAdapter {
  return {
    async repositoryInfo() {
      const repo = (await github(`/repos/${REPOSITORY}`)) as Record<string, unknown>;
      return {
        repository: REPOSITORY,
        defaultBranch: repo.default_branch,
        private: repo.private,
        htmlUrl: repo.html_url,
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
      const data = (await github(
        `/search/code?q=${encodeURIComponent(`${term} repo:${REPOSITORY}`)}&per_page=${MAX_SEARCH_RESULTS}`,
      )) as { total_count?: number; items?: Array<Record<string, unknown>> };
      return {
        repository: REPOSITORY,
        query: term,
        total: data.total_count ?? 0,
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
        const data = (await github(
          `/search/code?q=${encodeURIComponent(`${term} repo:${REPOSITORY}`)}&per_page=20`,
        )) as { items?: Array<Record<string, unknown>> };
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
          if (/^src\/(components|routes)\//.test(path)) score += 4;
          if (/\.(tsx|ts)$/.test(path)) score += 3;
          if (/test|spec|docs|migration/i.test(path)) score -= 3;
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
