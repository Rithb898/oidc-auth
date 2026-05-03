# OIDC Auth Server

A self-hosted OIDC (OpenID Connect) authentication server with OAuth 2.0 Authorization Code Flow support, user management, and application registration.

## Quick Navigation

| Getting Started | Core Features | API Reference |
|-----------------|---------------|---------------|
| [Prerequisites](#prerequisites) | [User Authentication](#user-authentication) | [OAuth Endpoints](#oauth-endpoints) |
| [Installation](#installation) | [OAuth Applications](#oauth-applications) | [Token Endpoints](#token-endpoints) |
| [Configuration](#configuration) | [PKCE Support](#pkce-support) | [User Endpoints](#user-endpoints) |
| [Quickstart](#quickstart) | [JWT Tokens](#jwt-tokens) | [Application Management](#application-management-api) |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18
- **pnpm** >= 8 (or npm/yarn)
- **PostgreSQL** >= 14
- **OpenSSL** (for generating RSA keys)

---

## Installation

### Step 1: Clone and Install Dependencies

```bash
git clone <repository-url>
cd oidc-auth
pnpm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/oidc_auth?schema=public"
APP_URL="http://localhost:5555"
PORT=5555

# Email configuration (Resend)
RESEND_API_KEY="re_your_api_key"
```

### Step 3: Generate RSA Keys

The server uses RS256 for JWT signing. Generate your RSA key pair:

```bash
mkdir -p backend/cert

# Generate private key
openssl genrsa -out backend/cert/private-key.pem 2048

# Extract public key
openssl rsa -in backend/cert/private-key.pem -pubout -out backend/cert/public-key.pub
```

### Step 4: Set Up Database

Run Prisma migrations to create the database schema:

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

### Step 5: Start the Server

```bash
# From project root
pnpm dev
```

The server will start at `http://localhost:5555`.

---

## Configuration

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `APP_URL` | Yes | Public URL of your auth server |
| `PORT` | No | Server port (default: 5555) |
| `RESEND_API_KEY` | Yes | Resend API key for email |

### OIDC Discovery Endpoint

Your auth server exposes standard OIDC discovery at:

```
GET /.well-known/openid-configuration
```

Response:
```json
{
  "issuer": "http://localhost:5555",
  "authorization_endpoint": "http://localhost:5555/o/authenticate",
  "token_endpoint": "http://localhost:5555/o/token",
  "userinfo_endpoint": "http://localhost:5555/o/userinfo",
  "jwks_uri": "http://localhost:5555/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_post"]
}
```

---

## Quickstart

### Creating Your First User

#### Step 1: Register a New User

```bash
curl -X POST http://localhost:5555/o/authenticate/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "your-secure-password"
  }'
```

Response:
```json
{
  "ok": true,
  "emailSent": true
}
```

#### Step 2: Verify Email

Check your email for a verification link, or use the API:

```bash
curl "http://localhost:5555/o/verify-email?token=YOUR_VERIFICATION_TOKEN"
```

#### Step 3: Sign In

```bash
curl -X POST http://localhost:5555/o/authenticate/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "your-secure-password"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## User Authentication

### Sign Up

Create a new user account.

**Endpoint:** `POST /o/authenticate/sign-up`

**Request Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (optional)",
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "ok": true,
  "emailSent": true
}
```

### Sign In

Authenticate a user and receive a JWT token.

**Endpoint:** `POST /o/authenticate/sign-in`

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Verify Email

Confirm email address ownership.

**Endpoint:** `GET /o/verify-email?token=<token>`

**Response:**
```json
{
  "ok": true
}
```

### Resend Verification Email

Request a new verification email.

**Endpoint:** `POST /o/resend-verification`

**Request Body:**
```json
{
  "email": "string (required)"
}
```

### Forgot Password

Initiate password reset flow.

**Endpoint:** `POST /o/forgot-password`

**Request Body:**
```json
{
  "email": "string (required)"
}
```

### Reset Password

Complete password reset with token.

**Endpoint:** `POST /o/reset-password`

**Request Body:**
```json
{
  "token": "string (required)",
  "password": "string (required, min 8 chars)"
}
```

---

## OAuth Applications

### Create an OAuth Application

Register a new OAuth application to enable third-party authentication.

**Step 1:** Authenticate and get a JWT token (see [Sign In](#sign-in)).

**Step 2:** Create the application:

```bash
curl -X POST http://localhost:5555/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "displayName": "My App",
    "applicationUrl": "https://myapp.com",
    "redirectUrl": "https://myapp.com/callback"
  }'
```

**Response:**
```json
{
  "id": "uuid",
  "displayName": "My App",
  "applicationUrl": "https://myapp.com",
  "redirectUrl": "https://myapp.com/callback",
  "clientId": "abc123...",
  "clientSecret": "xyz789...",
  "userId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Important:** The `clientSecret` is only shown once. Store it securely.

### List Applications

**Endpoint:** `GET /applications`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
[
  {
    "id": "uuid",
    "displayName": "My App",
    "clientId": "abc123...",
    "applicationUrl": "https://myapp.com",
    "redirectUrl": "https://myapp.com/callback",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Update Application

**Endpoint:** `PUT /applications/:clientId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "displayName": "Updated Name",
  "applicationUrl": "https://newurl.com",
  "redirectUrl": "https://newurl.com/callback"
}
```

### Delete Application

**Endpoint:** `DELETE /applications/:clientId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## OAuth 2.0 Authorization Code Flow

### Overview

The authorization code flow allows third-party applications to obtain access tokens on behalf of a user.

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│   App   │     │ OIDC Server  │     │    User     │
└────┬────┘     └──────┬───────┘     └──────┬──────┘
     │                 │                    │
     │  1. GET /o/authenticate?client_id=..│
     │────────────────>│                    │
     │                 │  2. Show login     │
     │                 │───────────────────>│
     │                 │                    │
     │                 │  3. POST sign-in   │
     │                 │<───────────────────│
     │                 │                    │
     │                 │  4. Generate code  │
     │                 │                    │
     │  5. Redirect to redirect_uri?code=..│
     │<────────────────│                    │
     │                 │                    │
     │  6. POST /o/token (code + secrets)  │
     │────────────────>│                    │
     │                 │                    │
     │  7. Return access_token              │
     │<────────────────│                    │
```

### Step 1: Redirect to Authorization Endpoint

Redirect the user to the authorization endpoint with the required parameters:

```
GET /o/authenticate?client_id=YOUR_CLIENT_ID&redirect_uri=https://myapp.com/callback&response_type=code&scope=openid%20profile%20email&state=random_state_string
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | Your application's client ID |
| `redirect_uri` | Yes | Must match the registered redirect URL |
| `response_type` | Yes | Must be `code` |
| `scope` | Yes | Space-separated scopes: `openid`, `profile`, `email` |
| `state` | Recommended | Opaque value for CSRF protection |
| `code_challenge` | Optional | PKCE code challenge |
| `code_challenge_method` | Optional | `S256` (default) or `plain` |

### Step 2: User Authentication

If the user is not authenticated, they will be presented with a login form. After successful authentication, an authorization code is generated.

### Step 3: Receive Authorization Code

The user is redirected back to your `redirect_uri` with the authorization code:

```
https://myapp.com/callback?code=AUTHORIZATION_CODE&state=random_state_string
```

Verify the `state` parameter matches your original value.

### Step 4: Exchange Code for Tokens

Exchange the authorization code for access and refresh tokens:

```bash
curl -X POST http://localhost:5555/o/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "https://myapp.com/callback"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

---

## PKCE Support

PKCE (Proof Key for Code Exchange) provides enhanced security for public clients (SPAs, mobile apps).

### Step 1: Generate Code Verifier and Challenge

```javascript
import crypto from 'crypto';

// Generate code_verifier (43-128 characters)
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// Generate code_challenge using S256
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');
```

### Step 2: Include Challenge in Authorization Request

```
GET /o/authenticate?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://myapp.com/callback&
  response_type=code&
  scope=openid%20profile%20email&
  code_challenge=YOUR_CODE_CHALLENGE&
  code_challenge_method=S256
```

### Step 3: Include Verifier in Token Request

```bash
curl -X POST http://localhost:5555/o/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE",
    "client_id": "YOUR_CLIENT_ID",
    "redirect_uri": "https://myapp.com/callback",
    "code_verifier": "YOUR_CODE_VERIFIER"
  }'
```

---

## JWT Tokens

### Access Token Structure

Access tokens are JWTs signed with RS256.

**Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "iss": "http://localhost:5555",
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": "true",
  "given_name": "John",
  "family_name": "Doe",
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg",
  "aud": "client_id",
  "exp": 1704067200
}
```

### Token Expiration

| Token Type | Expiration |
|------------|------------|
| Access Token | 1 hour |
| Refresh Token | 30 days |
| Authorization Code | 1 minute |

### Refresh Token Flow

Use a refresh token to obtain a new access token:

```bash
curl -X POST http://localhost:5555/o/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "new_refresh_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Token Revocation

Revoke a refresh token:

```bash
curl -X POST http://localhost:5555/o/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_REFRESH_TOKEN",
    "token_type_hint": "refresh_token",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'
```

### Verifying Tokens

Verify access tokens using the JWKS endpoint:

```javascript
import JWT from 'jsonwebtoken';
import jose from 'node-jose';

// Fetch JWKS
const jwksResponse = await fetch('http://localhost:5555/.well-known/jwks.json');
const jwks = await jwksResponse.json();

// Verify token
const decoded = JWT.verify(token, publicKey, {
  algorithms: ['RS256']
});
```

---

## User Info Endpoint

Get user information from an access token.

**Endpoint:** `GET /o/userinfo`

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": true,
  "given_name": "John",
  "family_name": "Doe",
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg"
}
```

---

## API Reference

### OAuth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/o/authenticate` | GET | Authorization endpoint |
| `/o/authenticate/sign-in` | POST | User sign-in |
| `/o/authenticate/sign-up` | POST | User registration |
| `/o/token` | POST | Token exchange |
| `/o/revoke` | POST | Token revocation |
| `/o/userinfo` | GET | User info |
| `/o/verify-email` | GET | Email verification |
| `/o/resend-verification` | POST | Resend verification email |
| `/o/forgot-password` | POST | Request password reset |
| `/o/reset-password` | POST | Reset password |

### Application Management API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/applications` | GET | List user's applications |
| `/applications` | POST | Create application |
| `/applications/:clientId` | GET | Get application details |
| `/applications/:clientId` | PUT | Update application |
| `/applications/:clientId` | DELETE | Delete application |

### OIDC Discovery

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/.well-known/openid-configuration` | GET | OIDC discovery document |
| `/.well-known/jwks.json` | GET | JSON Web Key Set |

---

## Security Best Practices

### Client Secrets

- Store client secrets securely (never in client-side code)
- Secrets are hashed before storage
- Only shown once during creation

### Authorization Codes

- Single-use only
- Expire after 1 minute
- Bound to client_id and redirect_uri

### Redirect URIs

- Must match exactly (no wildcards)
- Use HTTPS in production
- Validate against registered URLs

### State Parameter

- Always include a random state value
- Verify state matches on callback
- Prevents CSRF attacks

### PKCE

- Recommended for all public clients
- Use S256 method (not plain)
- Required for SPAs and mobile apps

---

## Integration Examples

### Next.js Integration

```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  
  // Verify state from session/cookie
  
  const tokenResponse = await fetch('http://localhost:5555/o/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      redirect_uri: 'http://localhost:3000/auth/callback',
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Store tokens securely
  // Redirect to app
  
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Express.js Middleware

```typescript
import JWT from 'jsonwebtoken';

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.slice(7);
  
  try {
    const claims = JWT.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
    });
    req.user = claims;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_client` | Invalid client_id or client_secret | Verify credentials |
| `invalid_grant` | Expired or used authorization code | Request new code |
| `invalid_redirect_uri` | Redirect URI doesn't match | Check registered URL |
| `email_not_verified` | User hasn't verified email | Check email or resend verification |

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug pnpm dev
```

---

## License

MIT
