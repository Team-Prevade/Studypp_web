import crypto from "node:crypto";

export type CollaborationPermission = "READ" | "WRITE";

export type CollaborationTokenPayload = {
  noteId: string;
  permission: CollaborationPermission;
  name: string;
  color: string;
  guest: boolean;
  exp: number;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for collaboration tokens");
  }
  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createCollaborationToken(
  payload: Omit<CollaborationTokenPayload, "exp">,
  ttlSeconds = TOKEN_TTL_SECONDS,
) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  );
  const signature = sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function verifyCollaborationToken(token: string | null | undefined) {
  if (!token) return null;

  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;

  const expectedSignature = sign(`${header}.${body}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CollaborationTokenPayload;
    if (!payload.noteId || !payload.name || !payload.color) return null;
    if (payload.permission !== "READ" && payload.permission !== "WRITE") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function collaborationColor(seed: string) {
  const palette = ["#185FA5", "#00796B", "#7C3AED", "#B45309", "#DC2626", "#0F766E"];
  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}
