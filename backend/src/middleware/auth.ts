import type { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";
import { PUBLIC_KEY } from "../utils/cert.js";
import type { JWTClaims } from "../utils/user-token.js";

export interface AuthenticatedRequest extends Request {
  user?: JWTClaims;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const claims = JWT.verify(token, PUBLIC_KEY, {
      algorithms: ["RS256"],
    }) as JWTClaims;
    req.user = claims;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
