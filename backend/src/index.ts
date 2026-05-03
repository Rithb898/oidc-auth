import path from "node:path";
import crypto from "node:crypto";

import express from "express";
import cors from "cors";
import jose from "node-jose";
import JWT from "jsonwebtoken";

import { PRIVATE_KEY, PUBLIC_KEY } from "./utils/cert.js";
import { db } from "./lib/db.js";
import type { JWTClaims } from "./utils/user-token.js";
import { applicationsRouter } from "./routes/applications.js";
import { oauthRouter } from "./routes/oauth.js";
import { userAuthRouter } from "./routes/user-auth.js";
import { sendEmail } from "./lib/email.js";
import { verificationEmailTemplate } from "./lib/email-templates.js";

const app = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));
app.use(express.static(path.resolve("public")));

app.get("/", (req, res) => {
  res.json({ message: "Hello from the OIDC Auth server!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "Server is healthy", healthy: true });
});

// OIDC Endpoints
app.get("/.well-known/openid-configuration", (req, res) => {
  const issuer = `${req.protocol}://${req.get("host")}`;
  return res.json({
    issuer,
    authorization_endpoint: `${issuer}/o/authenticate`,
    token_endpoint: `${issuer}/o/token`,
    userinfo_endpoint: `${issuer}/o/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
  });
});

app.get("/.well-known/jwks.json", async (req, res) => {
  const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
  return res.json({ keys: [key.toJSON()] });
});

app.use("/o", userAuthRouter);
app.use("/o", oauthRouter);
app.use("/applications", applicationsRouter);

app.post("/o/authenticate/sign-up", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password || !firstName) {
    res
      .status(400)
      .json({ message: "First name, email, and password are required." });
    return;
  }

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(400).json({ message: "Email is already in use." });
    return;
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");

  const user = await db.user.create({
    data: {
      firstName,
      lastName: lastName ?? null,
      email,
      password: hash,
      salt,
    },
  });

  const verifyToken = crypto.randomBytes(32).toString("hex");
  await db.emailVerification.create({
    data: {
      userId: user.id,
      token: verifyToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.APP_URL}/o/verify-email?token=${verifyToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: verificationEmailTemplate({ firstName: user.firstName, verifyUrl }),
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  res.status(201).json({ ok: true, emailSent: true });
});

app.get("/o/userinfo", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ message: "Missing or invalid Authorization header." });
    return;
  }

  const token = authHeader.slice(7);

  let claims: JWTClaims;
  try {
    claims = JWT.verify(token, PUBLIC_KEY, {
      algorithms: ["RS256"],
    }) as JWTClaims;
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
    return;
  }

  const user = await db.user.findUnique({ where: { id: claims.sub } });

  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.json({
    sub: user.id,
    email: user.email,
    email_verified: user.emailVerified,
    given_name: user.firstName,
    family_name: user.lastName,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    picture: user.profileImageURL,
  });
});

app.get("*path", (_req, res) => {
  res.sendFile(path.resolve("public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
