import dotenv from "dotenv";
import { getInstallationToken, searchCode } from "./src/services/github_service.js";

dotenv.config();

const OWNER = process.argv[2];
const REPO = process.argv[3];
const QUERY = process.argv[4];
const GITHUB_INSTALLATION_ID = 1;

if (!OWNER || !REPO || !QUERY) {
  console.log("Usage: node test_search.js <owner> <repo> <query>");
  process.exit(1);
}

async function main() {
  console.log("Getting installation token...");
  const token = await getInstallationToken(GITHUB_INSTALLATION_ID);

  console.log(`Searching in ${OWNER}/${REPO} for: ${QUERY}`);

  const results = await searchCode({ token, owner: OWNER, repo: REPO, query: QUERY });
  console.log(JSON.stringify(results, null, 2));
}

main();
