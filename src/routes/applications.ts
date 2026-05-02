import type { Router as RouterType } from "express";
import { Router } from "express";
import { db } from "../lib/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  generateClientId,
  generateClientSecret,
  hashClientSecret,
} from "../utils/crypto.js";

const router: RouterType = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const applications = await db.oAuthApplication.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
  });

  res.json(applications);
});

router.get("/:clientId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const clientId = String(req.params.clientId);
  const application = await db.oAuthApplication.findFirst({
    where: { clientId, userId: req.user!.sub },
  });

  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  res.json(application);
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { displayName, applicationUrl, redirectUrl } = req.body;

  if (!displayName || !applicationUrl || !redirectUrl) {
    return res.status(400).json({ error: "displayName, applicationUrl, and redirectUrl are required" });
  }

  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const clientSecretHash = hashClientSecret(clientSecret);

  const application = await db.oAuthApplication.create({
    data: {
      displayName,
      applicationUrl,
      redirectUrl,
      clientId,
      clientSecret: clientSecretHash,
      userId: req.user!.sub,
    },
  });

  res.status(201).json({
    ...application,
    clientSecret,
  });
});

router.put("/:clientId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { displayName, applicationUrl, redirectUrl } = req.body;

  const clientId = String(req.params.clientId);
  const existing = await db.oAuthApplication.findFirst({
    where: { clientId, userId: req.user!.sub },
  });

  if (!existing) {
    return res.status(404).json({ error: "Application not found" });
  }

  const application = await db.oAuthApplication.update({
    where: { id: existing.id },
    data: {
      displayName: displayName ?? existing.displayName,
      applicationUrl: applicationUrl ?? existing.applicationUrl,
      redirectUrl: redirectUrl ?? existing.redirectUrl,
    },
  });

  res.json(application);
});

router.delete("/:clientId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const clientId = String(req.params.clientId);
  const existing = await db.oAuthApplication.findFirst({
    where: { clientId, userId: req.user!.sub },
  });

  if (!existing) {
    return res.status(404).json({ error: "Application not found" });
  }

  await db.oAuthApplication.delete({ where: { id: existing.id } });

  res.status(204).send();
});

export { router as applicationsRouter };
