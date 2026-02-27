import jwt from "jsonwebtoken";

const GITHUB_API = "https://api.github.com";
const OLLAMA_API = `${process.env.OLLAMA_URL}/api/generate`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

export async function processPR(payload) {
  const { repository, pull_request, installation } = payload;

    console.log(repository, pull_request, installation)
  const owner = repository.owner.login;
  const repo = repository.name;
  const pullNumber = pull_request.number;

  const token = await getInstallationToken(installation.id);

  const filesRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const files = await filesRes.json();

  const reviewableFiles = files.filter(
    f =>
      f.status !== "removed" &&
      f.patch &&
      f.filename.match(/\.(js|ts|py|go|java|tsx|rs)$/)
  );

  for (const file of reviewableFiles) {
    const comments = await reviewFileWithLLM(file);

    for (const comment of comments) {
      await postReviewComment({
        token,
        owner,
        repo,
        pullNumber,
        commitId: pull_request.head.sha,
        path: file.filename,
        body: comment.comment,
        line: comment.line,
      });
    }
  }
}

async function reviewFileWithLLM(file) {
  const prompt = `
You are a senior engineer reviewing a pull request.

Only report serious:
- Bugs
- Security issues
- Performance problems

Ignore style and formatting.

Return strict JSON:
[
  { "line": number, "comment": "text" }
]

Diff:
${file.patch}
`;

  const response = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        top_p: 0.8,
      },
    }),
  });

  const data = await response.json();

  try {
    return JSON.parse(data.response);
  } catch (err) {
    console.error("LLM returned invalid JSON");
    return [];
  }
}

async function getInstallationToken(installationId) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;

  const appJwt = jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 600,
      iss: appId,
    },
    privateKey,
    { algorithm: "RS256" }
  );

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const data = await res.json();
  return data.token;
}
