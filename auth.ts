import crypto from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "studypp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type AppSessionPayload = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

type AppSessionUser = {
  id: string;
  email: string;
  name: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for application sessions");
  }
  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function createSessionToken(user: AppSessionUser) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    } satisfies AppSessionPayload),
  );
  const signature = sign(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

function verifySessionToken(token: string): AppSessionPayload | null {
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
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AppSessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: AppSessionUser) {
  cookies().set(SESSION_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function auth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return {
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    },
  };
}

export const handlers = {
  GET() {
    return Response.json({ error: "Auth.js endpoints are disabled" }, { status: 404 });
  },
  POST() {
    return Response.json({ error: "Auth.js endpoints are disabled" }, { status: 404 });
  },
};
