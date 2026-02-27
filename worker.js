import 'dotenv/config';
import { Worker } from "bullmq";
import { processPR, replyToComment } from "./src/queue/processPr.js";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

new Worker(
  "review",
  async job => {
    if (job.name === 'review-pr') {
      await processPR(job.data.payload);
    } else if (job.name === 'reply-comment') {
      await replyToComment(job.data.payload);
    }
  },
  { connection: { url: redisUrl } }
);
