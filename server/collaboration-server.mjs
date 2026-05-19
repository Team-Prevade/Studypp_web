import { Server } from "@hocuspocus/server";
import crypto from "node:crypto";

const port = Number(process.env.COLLAB_PORT || 1234);

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for collaboration tokens");
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function verifyCollaborationToken(token) {
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
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.noteId || !payload.name || !payload.color) return null;
    if (payload.permission !== "READ" && payload.permission !== "WRITE") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

const server = new Server({
  port,
  async onAuthenticate({ token, documentName, connectionConfig }) {
    const payload = verifyCollaborationToken(token);
    const expectedDocument = `apontamento:${payload?.noteId}`;

    if (!payload || documentName !== expectedDocument) {
      throw new Error("Unauthorized collaboration document");
    }

    connectionConfig.readOnly = payload.permission !== "WRITE";
    return payload;
  },
});

server.listen();

console.log(`Collaboration server listening on ws://localhost:${port}`);
