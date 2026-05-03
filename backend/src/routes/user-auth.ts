import { Router } from "express";
import type { Router as RouterType } from "express";
import crypto from "node:crypto";
import { db } from "../lib/db.js";
import { sendEmail } from "../lib/email.js";
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} from "../lib/email-templates.js";

const router: RouterType = Router();

router.get("/verify-email", async (req, res) => {
  const { token } = req.query as Record<string, string>;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const record = await db.emailVerification.findUnique({ where: { token } });

  if (!record) {
    return res.status(400).json({ error: "Invalid or expired verification link" });
  }

  if (record.expiresAt < new Date()) {
    await db.emailVerification.delete({ where: { id: record.id } });
    return res.status(400).json({ error: "Verification link has expired" });
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: true },
  });

  await db.emailVerification.delete({ where: { id: record.id } });

  return res.json({ ok: true });
});

router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    return res.json({ ok: true });
  }

  await db.emailVerification.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  await db.emailVerification.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verifyUrl = `${process.env.APP_URL}/o/verify-email?token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: verificationEmailTemplate({ firstName: user.firstName, verifyUrl }),
    });
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  return res.json({ ok: true });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Always return 200 to prevent email enumeration
  res.json({ ok: true });

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.emailVerified) return;

  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: passwordResetEmailTemplate({ firstName: user.firstName, resetUrl }),
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }
});

router.get("/reset-password/validate", async (req, res) => {
  const { token } = req.query as Record<string, string>;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.used) {
    return res.status(400).json({ error: "Invalid reset link" });
  }

  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { id: record.id } });
    return res.status(400).json({ error: "Reset link has expired" });
  }

  return res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.used) {
    return res.status(400).json({ error: "Invalid reset link" });
  }

  if (record.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { id: record.id } });
    return res.status(400).json({ error: "Reset link has expired" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(password + salt).digest("hex");

  await db.user.update({
    where: { id: record.userId },
    data: { password: hash, salt },
  });

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  await db.refreshToken.deleteMany({ where: { userId: record.userId } });

  return res.json({ ok: true });
});

export { router as userAuthRouter };
