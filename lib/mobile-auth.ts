import crypto from "node:crypto";
import prisma from "@/lib/prisma";

type MobileTokenType = "access" | "refresh";

type MobileTokenPayload = {
  sub: string;
  email: string;
  type: MobileTokenType;
  deviceId?: string;
  exp: number;
};

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for mobile API tokens");
  }
  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createMobileToken(payload: Omit<MobileTokenPayload, "exp">, ttlSeconds: number) {
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

export function createMobileTokenPair(user: { id: string; email: string }, deviceId?: string) {
  return {
    accessToken: createMobileToken(
      {
        sub: user.id,
        email: user.email,
        type: "access",
        deviceId,
      },
      ACCESS_TOKEN_TTL_SECONDS,
    ),
    refreshToken: createMobileToken(
      {
        sub: user.id,
        email: user.email,
        type: "refresh",
        deviceId,
      },
      REFRESH_TOKEN_TTL_SECONDS,
    ),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export function verifyMobileToken(token: string, expectedType?: MobileTokenType) {
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
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as MobileTokenPayload;
    if (expectedType && payload.type !== expectedType) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getMobileUserFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) {
    return { user: null, error: "Token ausente" };
  }

  const payload = verifyMobileToken(token, "access");
  if (!payload) {
    return { user: null, error: "Token inválido ou expirado" };
  }

  const user = await prisma.utilizador.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      nome: true,
      email: true,
      onboardingFeito: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return { user: null, error: "Utilizador não encontrado" };
  }

  return { user, error: null };
}
