import { llm } from "../llm.js";
import { getInstallationToken, postComment } from "../services/github_service.js";
import { loadPrompt } from "../prompts/index.js";
import logger from "../logger.js";

const BOT_HANDLE = process.env.GITHUB_APP_HANDLE;

function removeBotMention(text) {
  if (!BOT_HANDLE) return text;
  return text.replace(new RegExp(`@${BOT_HANDLE}`, 'gi'), BOT_HANDLE);
}

export async function processComment(payload) {
  const { repository, comment, installation } = payload;

  const owner = repository.owner.login;
  const repo = repository.name;

  const issueNumber = comment.issue_url.split('/').pop();

  logger.info({ owner, repo, issueNumber, user: comment.user.login }, "Processing comment reply");

  const token = await getInstallationToken(installation.id);

  const prompt = loadPrompt("comment-reply", {
    USER: comment.user.login,
    MESSAGE: comment.body,
  });

  const response = await llm.invoke(prompt);
  const replyBody = removeBotMention(response.content);

  await postComment({ token, owner, repo, issueNumber, body: replyBody });

  logger.info({ owner, repo, issueNumber }, "Comment reply posted");
}
