import crypto from "crypto";

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

const secret = generateSecret();
console.log("Generated webhook secret:", secret);
