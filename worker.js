import { Worker } from "bullmq";
import { processPR } from "./src/queue/processPr.js";

new Worker(
  "review",
  async job => {
    if (job.name === 'review-pr') {
    console.log(job.data)
        await processPR(job.data.payload);
    }
  },
  { connection: { url: process.env.REDIS_URL } }
);
