import { Router } from "express";
import type { Router as RouterType } from "express";
import crypto from "node:crypto";
import path from "node:path";
import JWT from "jsonwebtoken";
import { db } from "../lib/db.js";
import { PRIVATE_KEY, PUBLIC_KEY } from "../utils/cert.js";
import {
  generateAuthCode,
  generateRefreshToken,
  hashClientSecret,
  verifyClientSecret,
  computeCodeChallenge,
} from "../utils/crypto.js";

const router: RouterType = Router();

router.get("/authenticate", async (req, res) => {
  const { client_id, redirect_uri, scope, state, response_type, code_challenge, code_challenge_method } =
    req.query as Record<string, string>;

  if (response_type && response_type !== "code") {
    return res.status(400).json({ error: "Unsupported response_type" });
  }

  if (code_challenge_method && code_challenge_method !== "S256" && code_challenge_method !== "plain") {
    return res.status(400).json({ error: "Invalid code_challenge_method" });
  }

  if (client_id && redirect_uri) {
    const application = await db.oAuthApplication.findUnique({
      where: { clientId: client_id },
    });

    if (!application) {
      return res.status(400).json({ error: "Invalid client_id" });
    }

    if (application.redirectUrl !== redirect_uri) {
      return res.status(400).json({ error: "Invalid redirect_uri" });
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const claims = JWT.verify(token, PUBLIC_KEY, {
        algorithms: ["RS256"],
      }) as { sub: string };

      if (client_id && redirect_uri && scope) {
        const application = await db.oAuthApplication.findUnique({
          where: { clientId: client_id },
        });

        if (!application || application.redirectUrl !== redirect_uri) {
          return res.status(400).json({ error: "Invalid OAuth parameters" });
        }

        const code = generateAuthCode();
        await db.authCode.create({
          data: {
            code,
            clientId: client_id,
            userId: claims.sub,
            redirectUri: redirect_uri,
            scope: scope as string,
            codeChallenge: code_challenge || null,
            codeChallengeMethod: code_challenge_method || "S256",
            expiresAt: new Date(Date.now() + 60 * 1000),
          },
        });

        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set("code", code);
        if (state) redirectUrl.searchParams.set("state", state);
        return res.json({ redirect: redirectUrl.toString() });
      }
    } catch {}
  }

  res.sendFile(path.resolve("public", "authenticate.html"));
});

router.post("/authenticate/sign-in", async (req, res) => {
  const { email, password, client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.password || !user.salt) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const hash = crypto
    .createHash("sha256")
    .update(password + user.salt)
    .digest("hex");

  if (hash !== user.password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (client_id && redirect_uri) {
    const application = await db.oAuthApplication.findUnique({
      where: { clientId: client_id },
    });

    if (!application) {
      return res.status(400).json({ error: "Invalid client_id" });
    }

    if (application.redirectUrl !== redirect_uri) {
      return res.status(400).json({ error: "Invalid redirect_uri" });
    }

    const code = generateAuthCode();
    await db.authCode.create({
      data: {
        code,
        clientId: client_id,
        userId: user.id,
        redirectUri: redirect_uri,
        scope: scope || "openid",
        codeChallenge: code_challenge || null,
        codeChallengeMethod: code_challenge_method || "S256",
        expiresAt: new Date(Date.now() + 60 * 1000),
      },
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);
    return res.json({ redirect: redirectUrl.toString() });
  }

  const issuer = `${req.protocol}://${req.get("host")}`;
  const now = Math.floor(Date.now() / 1000);

  const claims = {
    iss: issuer,
    sub: user.id,
    email: user.email,
    email_verified: String(user.emailVerified),
    exp: now + 60 * 60,
    given_name: user.firstName ?? "",
    family_name: user.lastName ?? undefined,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    picture: user.profileImageURL ?? undefined,
  };

  const token = JWT.sign(claims, PRIVATE_KEY, { algorithm: "RS256" });
  res.json({ token });
});

router.post("/token", async (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token, code_verifier } = req.body;

  if (grant_type === "refresh_token") {
    if (!refresh_token || !client_id) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const application = await db.oAuthApplication.findUnique({
      where: { clientId: client_id },
    });

    if (!application) {
      return res.status(401).json({ error: "invalid_client" });
    }

    if (application.clientSecret && client_secret) {
      if (!verifyClientSecret(client_secret, application.clientSecret)) {
        return res.status(401).json({ error: "invalid_client" });
      }
    }

    const hashedToken = hashClientSecret(refresh_token);
    const storedToken = await db.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    if (storedToken.expiresAt < new Date()) {
      await db.refreshToken.delete({ where: { id: storedToken.id } });
      return res.status(400).json({ error: "invalid_grant" });
    }

    if (storedToken.clientId !== client_id) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const user = storedToken.user;
    const issuer = `${req.protocol}://${req.get("host")}`;
    const now = Math.floor(Date.now() / 1000);

    const accessToken = JWT.sign(
      {
        iss: issuer,
        sub: user.id,
        email: user.email,
        email_verified: String(user.emailVerified),
        exp: now + 60 * 60,
        given_name: user.firstName ?? "",
        family_name: user.lastName ?? undefined,
        name: [user.firstName, user.lastName].filter(Boolean).join(" "),
        picture: user.profileImageURL ?? undefined,
        aud: client_id,
      },
      PRIVATE_KEY,
      { algorithm: "RS256" },
    );

    const newRefreshToken = generateRefreshToken();
    await db.refreshToken.delete({ where: { id: storedToken.id } });
    await db.refreshToken.create({
      data: {
        token: hashClientSecret(newRefreshToken),
        userId: user.id,
        clientId: client_id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: "Bearer",
      expires_in: 3600,
    });
  }

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  if (!code || !client_id || !redirect_uri) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const application = await db.oAuthApplication.findUnique({
    where: { clientId: client_id },
  });

  if (!application) {
    return res.status(401).json({ error: "invalid_client" });
  }

  if (application.clientSecret && client_secret) {
    if (!verifyClientSecret(client_secret, application.clientSecret)) {
      return res.status(401).json({ error: "invalid_client" });
    }
  }

  const authCode = await db.authCode.findUnique({
    where: { code },
  });

  if (!authCode) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  if (authCode.used) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  if (authCode.expiresAt < new Date()) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  if (authCode.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  if (authCode.clientId !== client_id) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return res.status(400).json({ error: "invalid_grant", error_description: "code_verifier required" });
    }

    const method = (authCode.codeChallengeMethod as "S256" | "plain") || "S256";
    const computedChallenge = computeCodeChallenge(code_verifier, method);

    if (computedChallenge !== authCode.codeChallenge) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
    }
  }

  await db.authCode.update({
    where: { id: authCode.id },
    data: { used: true },
  });

  const user = await db.user.findUnique({
    where: { id: authCode.userId },
  });

  if (!user) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  const issuer = `${req.protocol}://${req.get("host")}`;
  const now = Math.floor(Date.now() / 1000);

  const accessToken = JWT.sign(
    {
      iss: issuer,
      sub: user.id,
      email: user.email,
      email_verified: String(user.emailVerified),
      exp: now + 60 * 60,
      given_name: user.firstName ?? "",
      family_name: user.lastName ?? undefined,
      name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      picture: user.profileImageURL ?? undefined,
      aud: client_id,
    },
    PRIVATE_KEY,
    { algorithm: "RS256" },
  );

  const refreshToken = generateRefreshToken();
  await db.refreshToken.create({
    data: {
      token: hashClientSecret(refreshToken),
      userId: user.id,
      clientId: client_id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: authCode.scope,
  });
});

router.post("/revoke", async (req, res) => {
  const { token, token_type_hint, client_id, client_secret } = req.body;

  if (!token || !client_id) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const application = await db.oAuthApplication.findUnique({
    where: { clientId: client_id },
  });

  if (!application) {
    return res.status(401).json({ error: "invalid_client" });
  }

  if (application.clientSecret && client_secret) {
    if (!verifyClientSecret(client_secret, application.clientSecret)) {
      return res.status(401).json({ error: "invalid_client" });
    }
  }

  const hashedToken = hashClientSecret(token);
  await db.refreshToken.deleteMany({
    where: { token: hashedToken, clientId: client_id },
  });

  res.status(200).send();
});

export { router as oauthRouter };
