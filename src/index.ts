import express from 'express';
import path from 'node:path';
import jose from "node-jose";
import { PUBLIC_KEY } from './utils/cert.js';

const app = express()
const PORT = process.env.PORT || 5555

app.use(express.json())
app.use(express.static(path.resolve("public")))

app.get("/", (req, res) => {
  res.json({ message: "Hello from the OIDC Auth server!" })
})

app.get("/health", (req, res) => {
  res.json({ status: "Server is healthy", healthy: true })
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// OIDC Endpoints
app.get("/.well-known/openid-configuration", (req, res) => {
  const issuer = `${req.protocol}://${req.get('host')}`;
  return res.json({
    issuer,
    authorization_endpoint: `${issuer}/o/authenticate`,
    userinfo_endpoint: `${issuer}/o/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`
  })
})

app.get("/.well-known/jwks.json", async (req, res) => {
  const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
  return res.json({ keys: [key.toJSON()] });
})

