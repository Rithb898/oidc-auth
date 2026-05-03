# OAuth 2.0 Authorization Code Flow Implementation Plan

## Overview

Add OAuth 2.0 Authorization Code flow support to the existing OIDC auth server with authenticated user application management.

---

## Database Schema

### Models to Add/Update

#### User Model (Update)
```prisma
model User {
  id              String   @id @default(uuid())
  firstName       String
  lastName        String?
  profileImageURL String?
  email           String   @unique
  emailVerified   Boolean  @default(false)
  password        String
  salt            String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  oauthApplications OAuthApplication[]
  authCodes         AuthCode[]
  refreshTokens     RefreshToken[]

  @@index([email])
  @@map("users")
}
```

#### OAuthApplication Model (New)
```prisma
model OAuthApplication {
  id              String   @id @default(uuid())
  displayName     String
  applicationUrl  String
  redirectUrl     String
  clientId        String   @unique
  clientSecret    String   // hashed
  userId          String   // owner
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user          User           @relation(fields: [userId], references: [id])
  authCodes     AuthCode[]
  refreshTokens RefreshToken[]

  @@map("oauth_applications")
}
```

#### AuthCode Model (New)
```prisma
model AuthCode {
  id          String   @id @default(uuid())
  code        String   @unique
  clientId    String
  userId      String
  redirectUri String
  scope       String
  expiresAt   DateTime
  used        Boolean  @default(false)
  createdAt   DateTime @default(now())

  application OAuthApplication @relation(fields: [clientId], references: [clientId])
  user        User             @relation(fields: [userId], references: [id])

  @@index([code])
  @@index([expiresAt])
  @@map("auth_codes")
}
```

#### RefreshToken Model (New)
```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  clientId  String
  expiresAt DateTime
  createdAt DateTime @default(now())

  application OAuthApplication @relation(fields: [clientId], references: [clientId])
  user        User             @relation(fields: [userId], references: [id])

  @@index([token])
  @@map("refresh_tokens")
}
```

---

## OAuth Flow Sequence

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
     │                 │  5. Save to DB     │
     │                 │                    │
     │  6. Redirect to redirect_uri?code=..│
     │<────────────────│                    │
     │                 │                    │
     │  7. POST /o/token (code, client_id,  │
     │     client_secret)                   │
     │────────────────>│                    │
     │                 │  8. Validate       │
     │                 │  9. Generate tokens│
     │  10. Return access_token,            │
     │      refresh_token                   │
     │<────────────────│                    │
     │                 │                    │
```

---

## API Routes

### OAuth Flow Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /o/authenticate` | GET | Handle OAuth params, show login or redirect with code |
| `POST /o/authenticate/sign-in` | POST | Sign in, generate code if OAuth flow active |
| `POST /o/token` | POST | Exchange code for access + refresh tokens |

### Application Management Routes (Authenticated)

| Route | Method | Purpose |
|-------|--------|---------|
| `GET /applications` | GET | List user's own applications |
| `GET /applications/new` | GET | Show create form |
| `POST /applications` | POST | Create application |
| `GET /applications/:clientId` | GET | Show application details |
| `GET /applications/:clientId/edit` | GET | Show edit form |
| `PUT /applications/:clientId` | PUT | Update application |
| `DELETE /applications/:clientId` | DELETE | Delete application |

---

## Route Implementations

### GET /o/authenticate

**Query Parameters:**
- `client_id` - OAuth application client ID
- `redirect_uri` - Where to redirect after auth
- `scope` - Requested scopes (openid, profile, email)
- `state` - Client state (returned as-is)
- `response_type` - Must be "code"

**Logic:**
1. Validate `client_id` exists in database
2. Validate `redirect_uri` matches application's `redirectUrl`
3. Validate `response_type === "code"`
4. If user already authenticated (JWT in header/cookie):
   - Generate authorization code
   - Save to DB with 1 minute expiry
   - Redirect to `{redirect_uri}?code={code}&state={state}`
5. If not authenticated:
   - Store OAuth params for later
   - Show login form

### POST /o/authenticate/sign-in

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "oauth_client_id": "optional",
  "oauth_redirect_uri": "optional",
  "oauth_scope": "optional",
  "oauth_state": "optional"
}
```

**Logic:**
1. Validate email/password
2. Verify user credentials
3. If OAuth params present:
   - Validate client_id and redirect_uri
   - Generate authorization code
   - Save AuthCode to DB (1 min expiry)
   - Redirect to `{redirect_uri}?code={code}&state={state}`
4. If no OAuth params:
   - Return JWT token (existing behavior)

### POST /o/token

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "client_id": "client_id",
  "client_secret": "client_secret",
  "redirect_uri": "redirect_uri"
}
```

**Logic:**
1. Validate `grant_type === "authorization_code"`
2. Find application by `client_id`
3. Verify `client_secret` (compare hash)
4. Find AuthCode record
5. Validate:
   - Code not expired
   - Code not used
   - Redirect URI matches
6. Mark code as used
7. Generate:
   - Access token (JWT, 1 hour)
   - Refresh token (random string, 30 days)
8. Save RefreshToken to DB
9. Return token response

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

## Application Management

### Create Application (POST /applications)

**Request Body:**
```json
{
  "displayName": "My App",
  "applicationUrl": "https://myapp.com",
  "redirectUrl": "https://myapp.com/callback"
}
```

**Logic:**
1. Validate authenticated user
2. Generate:
   - `clientId`: `crypto.randomBytes(16).toString("hex")` (32 chars)
   - `clientSecret`: `crypto.randomBytes(32).toString("hex")` (64 chars)
3. Hash `clientSecret` before storing
4. Save OAuthApplication to DB with `userId` as owner
5. Return application details with **plain text** clientSecret (shown only once)

**Response:**
```json
{
  "id": "uuid",
  "displayName": "My App",
  "applicationUrl": "https://myapp.com",
  "redirectUrl": "https://myapp.com/callback",
  "clientId": "abc123...",
  "clientSecret": "xyz789...",  // SHOWN ONLY ONCE
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Files Structure

```
src/
├── index.ts                  # Mount all routes
├── lib/
│   └── db.ts                 # Existing
├── middleware/
│   └── auth.ts               # NEW: requireAuth middleware
├── routes/
│   ├── oauth.ts              # NEW: /o/authenticate, /o/token
│   └── applications.ts       # NEW: /applications CRUD
├── utils/
│   ├── cert.ts               # Existing
│   ├── user-token.ts         # Existing
│   └── crypto.ts             # NEW: clientId/secret generation
└── prisma/
    └── schema.prisma         # Update with new models

public/
├── authenticate.html         # Update to handle OAuth params
├── applications.html         # NEW: list user's apps
└── application-form.html     # NEW: create/edit form
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/prisma/schema.prisma` | Modify | Add OAuthApplication, AuthCode, RefreshToken models; Update User model |
| `src/utils/crypto.ts` | Create | Client ID/secret generation, secret hashing utilities |
| `src/middleware/auth.ts` | Create | requireAuth middleware for authenticated routes |
| `src/routes/applications.ts` | Create | CRUD routes for OAuth applications |
| `src/routes/oauth.ts` | Create | OAuth authorization and token endpoints |
| `public/applications.html` | Create | UI to list user's applications |
| `public/application-form.html` | Create | UI to create/edit application |
| `public/authenticate.html` | Modify | Handle OAuth query parameters |
| `src/index.ts` | Modify | Mount new routes, update OIDC discovery |

---

## OIDC Discovery Update

**Update `/.well-known/openid-configuration`:**
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

## Execution Steps

1. **Update Prisma schema** - Add all 4 models
2. **Run migration** - `pnpm prisma migrate dev --name add_oauth`
3. **Create crypto utility** - `src/utils/crypto.ts`
4. **Create auth middleware** - `src/middleware/auth.ts`
5. **Create application routes** - `src/routes/applications.ts`
6. **Create OAuth routes** - `src/routes/oauth.ts`
7. **Create HTML forms** - `public/applications.html`, `public/application-form.html`
8. **Update authenticate.html** - Handle OAuth params
9. **Update index.ts** - Mount routes, update OIDC discovery
10. **Test** - Full OAuth flow

---

## Token Details

### Access Token (JWT)
- Algorithm: RS256
- Expiry: 1 hour
- Claims: `iss`, `sub`, `email`, `email_verified`, `given_name`, `family_name`, `name`, `picture`, `aud`

### Refresh Token
- Format: Random 64 character hex string
- Expiry: 30 days
- Stored in database (hashed)

### Authorization Code
- Format: Random 32 character hex string
- Expiry: 1 minute
- Single use (marked as `used` after exchange)

---

## Security Considerations

1. **Client Secret** - Hashed before storage, shown only once on creation
2. **Authorization Code** - Single use, short expiry (1 min)
3. **Redirect URI** - Must match exactly what's registered
4. **State Parameter** - Returned as-is to prevent CSRF
5. **PKCE** - (Future enhancement) For public clients
