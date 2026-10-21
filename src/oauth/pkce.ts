import { createHash } from "node:crypto";

export const challengeFor = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");
