import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Tab = "quickstart" | "flow" | "pkce" | "api" | "tokens" | "examples";

function CodeBlock({ code }: { code: string; language?: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono">
      <code>{code}</code>
    </pre>
  );
}

function EndpointTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium">Endpoint</th>
            <th className="text-left py-2 pr-4 font-medium">Method</th>
            <th className="text-left py-2 font-medium">Purpose</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-2 pr-4 font-mono text-xs">/.well-known/openid-configuration</td>
            <td className="py-2 pr-4">GET</td>
            <td className="py-2">OIDC discovery</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-mono text-xs">/.well-known/jwks.json</td>
            <td className="py-2 pr-4">GET</td>
            <td className="py-2">JWT public keys</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-mono text-xs">/o/authenticate</td>
            <td className="py-2 pr-4">GET</td>
            <td className="py-2">Authorization endpoint</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-mono text-xs">/o/token</td>
            <td className="py-2 pr-4">POST</td>
            <td className="py-2">Token exchange</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-mono text-xs">/o/userinfo</td>
            <td className="py-2 pr-4">GET</td>
            <td className="py-2">User profile</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-mono text-xs">/o/revoke</td>
            <td className="py-2 pr-4">POST</td>
            <td className="py-2">Token revocation</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function QuickStartSection() {
  const code = `// Redirect users to authorize
const authUrl = \`\${ISSUER}/o/authenticate?\` +
  \`client_id=YOUR_CLIENT_ID&\` +
  \`redirect_uri=https://yourapp.com/callback&\` +
  \`response_type=code&\` +
  \`scope=openid profile email&\` +
  \`state=random_state&\` +
  \`code_challenge=PKCE_CHALLENGE&\` +
  \`code_challenge_method=S256`;

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Get started with OIDC authentication in minutes. First, register your application
        in the <Link to="/applications/new" className="text-blue-600 hover:underline">Applications</Link> section.
      </p>
      <h3 className="font-semibold text-lg">Step 1: Redirect to Authorization</h3>
      <CodeBlock code={code} />
      <h3 className="font-semibold text-lg">Step 2: Handle the Callback</h3>
      <p className="text-gray-600">
        After user authorization, you'll receive a <code className="bg-gray-100 px-1 rounded text-sm">code</code> parameter
        in your redirect URI. Exchange it for tokens via the token endpoint.
      </p>
    </div>
  );
}

function FlowSection() {
  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        This server implements OAuth 2.0 Authorization Code flow with PKCE support.
      </p>
      <div className="bg-gray-50 p-4 rounded-md space-y-3">
        <div className="flex items-start gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</span>
          <div>
            <p className="font-medium">Authorization Request</p>
            <p className="text-sm text-gray-600">Redirect user to /o/authenticate with client_id, redirect_uri, scope, state, and PKCE parameters</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</span>
          <div>
            <p className="font-medium">User Authentication</p>
            <p className="text-sm text-gray-600">User signs in or creates an account</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">3</span>
          <div>
            <p className="font-medium">Authorization Code</p>
            <p className="text-sm text-gray-600">Server redirects back with a single-use code (valid for 1 minute)</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">4</span>
          <div>
            <p className="font-medium">Token Exchange</p>
            <p className="text-sm text-gray-600">Exchange the code at /o/token for access_token and refresh_token</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">5</span>
          <div>
            <p className="font-medium">Access User Data</p>
            <p className="text-sm text-gray-600">Use access_token to call /o/userinfo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PKCESection() {
  const verifierCode = `// Generate a code_verifier (43-128 characters)
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}`;

  const challengeCode = `// Generate code_challenge from verifier (S256 method)
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=+$/, '');
}`;

  const tokenCode = `// Include code_verifier in token request
const response = await fetch('\${ISSUER}/o/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: 'AUTHORIZATION_CODE',
    client_id: 'YOUR_CLIENT_ID',
    redirect_uri: 'https://yourapp.com/callback',
    code_verifier: 'YOUR_CODE_VERIFIER'
  })
});`;

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        PKCE (Proof Key for Code Exchange) protects public clients like SPAs and mobile apps
        from authorization code interception attacks.
      </p>
      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> PKCE is strongly recommended for all public clients.
          Use <code className="bg-yellow-100 px-1 rounded">S256</code> method for better security.
        </p>
      </div>
      <h3 className="font-semibold text-lg">Generate Code Verifier</h3>
      <CodeBlock code={verifierCode} />
      <h3 className="font-semibold text-lg">Generate Code Challenge</h3>
      <CodeBlock code={challengeCode} />
      <h3 className="font-semibold text-lg">Token Request with PKCE</h3>
      <CodeBlock code={tokenCode} />
    </div>
  );
}

function APISection() {
  const discoveryResponse = `{
  "issuer": "https://your-oidc-server.com",
  "authorization_endpoint": "https://your-oidc-server.com/o/authenticate",
  "token_endpoint": "https://your-oidc-server.com/o/token",
  "userinfo_endpoint": "https://your-oidc-server.com/o/userinfo",
  "jwks_uri": "https://your-oidc-server.com/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "scopes_supported": ["openid", "profile", "email"]
}`;

  const tokenResponse = `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}`;

  const userinfoResponse = `{
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": true,
  "given_name": "John",
  "family_name": "Doe",
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg"
}`;

  return (
    <div className="space-y-6">
      <EndpointTable />
      
      <h3 className="font-semibold text-lg pt-4">Discovery Endpoint</h3>
      <p className="text-sm text-gray-600 mb-2">GET /.well-known/openid-configuration</p>
      <CodeBlock code={discoveryResponse} language="json" />

      <h3 className="font-semibold text-lg">Authorization Endpoint</h3>
      <p className="text-sm text-gray-600 mb-2">GET /o/authenticate</p>
      <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
        <p><strong>Parameters:</strong></p>
        <ul className="list-disc list-inside text-gray-600 ml-2">
          <li><code className="bg-gray-100 px-1 rounded">client_id</code> - Your application's client ID (required)</li>
          <li><code className="bg-gray-100 px-1 rounded">redirect_uri</code> - Must match registered URI (required)</li>
          <li><code className="bg-gray-100 px-1 rounded">response_type</code> - Must be "code" (required)</li>
          <li><code className="bg-gray-100 px-1 rounded">scope</code> - e.g., "openid profile email" (required)</li>
          <li><code className="bg-gray-100 px-1 rounded">state</code> - Random string for CSRF protection (recommended)</li>
          <li><code className="bg-gray-100 px-1 rounded">code_challenge</code> - PKCE challenge (recommended)</li>
          <li><code className="bg-gray-100 px-1 rounded">code_challenge_method</code> - "S256" or "plain" (default: S256)</li>
        </ul>
      </div>

      <h3 className="font-semibold text-lg">Token Endpoint</h3>
      <p className="text-sm text-gray-600 mb-2">POST /o/token</p>
      <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
        <p><strong>Request Body:</strong></p>
        <ul className="list-disc list-inside text-gray-600 ml-2">
          <li><code className="bg-gray-100 px-1 rounded">grant_type</code> - "authorization_code" or "refresh_token"</li>
          <li><code className="bg-gray-100 px-1 rounded">code</code> - Authorization code (for authorization_code grant)</li>
          <li><code className="bg-gray-100 px-1 rounded">refresh_token</code> - Refresh token (for refresh_token grant)</li>
          <li><code className="bg-gray-100 px-1 rounded">client_id</code> - Your application's client ID (required)</li>
          <li><code className="bg-gray-100 px-1 rounded">client_secret</code> - For confidential clients</li>
          <li><code className="bg-gray-100 px-1 rounded">redirect_uri</code> - Must match original request</li>
          <li><code className="bg-gray-100 px-1 rounded">code_verifier</code> - PKCE verifier (if used)</li>
        </ul>
      </div>
      <p className="text-sm text-gray-600 mt-2"><strong>Response:</strong></p>
      <CodeBlock code={tokenResponse} language="json" />

      <h3 className="font-semibold text-lg">UserInfo Endpoint</h3>
      <p className="text-sm text-gray-600 mb-2">GET /o/userinfo</p>
      <p className="text-sm text-gray-600">
        Requires <code className="bg-gray-100 px-1 rounded">Authorization: Bearer {`{access_token}`}</code> header.
      </p>
      <CodeBlock code={userinfoResponse} language="json" />

      <h3 className="font-semibold text-lg">Token Revocation</h3>
      <p className="text-sm text-gray-600 mb-2">POST /o/revoke</p>
      <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
        <p><strong>Request Body:</strong></p>
        <ul className="list-disc list-inside text-gray-600 ml-2">
          <li><code className="bg-gray-100 px-1 rounded">token</code> - Access or refresh token to revoke</li>
          <li><code className="bg-gray-100 px-1 rounded">token_type_hint</code> - "access_token" or "refresh_token" (optional)</li>
          <li><code className="bg-gray-100 px-1 rounded">client_id</code> - Your application's client ID (required)</li>
          <li><code className="bg-gray-100 px-1 rounded">client_secret</code> - For confidential clients</li>
        </ul>
      </div>
    </div>
  );
}

function TokensSection() {
  const jwtClaims = `{
  "iss": "https://your-oidc-server.com",
  "sub": "user-uuid",
  "email": "user@example.com",
  "email_verified": "true",
  "given_name": "John",
  "family_name": "Doe",
  "name": "John Doe",
  "picture": "https://example.com/avatar.jpg",
  "aud": "your-client-id",
  "exp": 1699999999
}`;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Token Types</h3>
      <div className="grid gap-3">
        <div className="border rounded-md p-3">
          <p className="font-medium">Access Token</p>
          <ul className="text-sm text-gray-600 list-disc list-inside ml-2 mt-1">
            <li>JWT signed with RS256</li>
            <li>1 hour expiry (3600 seconds)</li>
            <li>Contains user claims</li>
          </ul>
        </div>
        <div className="border rounded-md p-3">
          <p className="font-medium">Refresh Token</p>
          <ul className="text-sm text-gray-600 list-disc list-inside ml-2 mt-1">
            <li>Random string (opaque)</li>
            <li>30 days expiry</li>
            <li>Single-use (new token issued on refresh)</li>
          </ul>
        </div>
        <div className="border rounded-md p-3">
          <p className="font-medium">Authorization Code</p>
          <ul className="text-sm text-gray-600 list-disc list-inside ml-2 mt-1">
            <li>Single-use only</li>
            <li>1 minute expiry</li>
            <li>Marked as used after exchange</li>
          </ul>
        </div>
      </div>

      <h3 className="font-semibold text-lg pt-2">JWT Claims</h3>
      <p className="text-gray-600 text-sm">Access tokens contain the following claims:</p>
      <CodeBlock code={jwtClaims} language="json" />
      
      <div className="grid gap-2 text-sm">
        <div className="flex gap-2">
          <code className="bg-gray-100 px-2 rounded shrink-0">iss</code>
          <span className="text-gray-600">Issuer - the OIDC server URL</span>
        </div>
        <div className="flex gap-2">
          <code className="bg-gray-100 px-2 rounded shrink-0">sub</code>
          <span className="text-gray-600">Subject - unique user identifier</span>
        </div>
        <div className="flex gap-2">
          <code className="bg-gray-100 px-2 rounded shrink-0">aud</code>
          <span className="text-gray-600">Audience - client_id of the requesting app</span>
        </div>
        <div className="flex gap-2">
          <code className="bg-gray-100 px-2 rounded shrink-0">exp</code>
          <span className="text-gray-600">Expiration timestamp</span>
        </div>
        <div className="flex gap-2">
          <code className="bg-gray-100 px-2 rounded shrink-0">email</code>
          <span className="text-gray-600">User's email address</span>
        </div>
        <div className="flex gap-2">
          <code className="bg-gray-100 px-2 rounded shrink-0">name</code>
          <span className="text-gray-600">User's full name</span>
        </div>
      </div>

      <h3 className="font-semibold text-lg pt-2">Token Verification</h3>
      <p className="text-gray-600 text-sm">
        Verify JWT signatures using the public keys from <code className="bg-gray-100 px-1 rounded">/.well-known/jwks.json</code>.
        The server uses RS256 algorithm with asymmetric keys.
      </p>
    </div>
  );
}

function ExamplesSection() {
  const jsCode = `// JavaScript/TypeScript Example
const ISSUER = 'https://your-oidc-server.com';
const CLIENT_ID = 'your-client-id';
const REDIRECT_URI = 'https://yourapp.com/callback';

// Step 1: Generate PKCE verifier and challenge
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=+$/, '');
}

// Step 2: Start authorization flow
async function authorize() {
  const verifier = generateRandomString(64);
  localStorage.setItem('code_verifier', verifier);
  
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = generateRandomString(16);
  localStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });
  
  window.location.href = \`\${ISSUER}/o/authenticate?\${params}\`;
}

// Step 3: Handle callback and exchange code
async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (state !== localStorage.getItem('oauth_state')) {
    throw new Error('Invalid state');
  }
  
  const verifier = localStorage.getItem('code_verifier');
  
  const response = await fetch(\`\${ISSUER}/o/token\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
  });
  
  const tokens = await response.json();
  return tokens; // { access_token, refresh_token, token_type, expires_in }
}

// Step 4: Get user info
async function getUserInfo(accessToken) {
  const response = await fetch(\`\${ISSUER}/o/userinfo\`, {
    headers: { 'Authorization': \`Bearer \${accessToken}\` }
  });
  return response.json();
}`;

  const pythonCode = `# Python Example
import hashlib
import secrets
import base64
import requests
from urllib.parse import urlencode, parse_qs

ISSUER = 'https://your-oidc-server.com'
CLIENT_ID = 'your-client-id'
REDIRECT_URI = 'https://yourapp.com/callback'

def generate_code_verifier():
    return secrets.token_urlsafe(32)

def generate_code_challenge(verifier):
    data = verifier.encode('utf-8')
    digest = hashlib.sha256(data).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b'=').decode('utf-8')

def get_authorization_url(verifier):
    challenge = generate_code_challenge(verifier)
    state = secrets.token_urlsafe(16)
    
    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'response_type': 'code',
        'scope': 'openid profile email',
        'state': state,
        'code_challenge': challenge,
        'code_challenge_method': 'S256'
    }
    
    return f"{ISSUER}/o/authenticate?{urlencode(params)}", state

def exchange_code(code, verifier):
    response = requests.post(
        f"{ISSUER}/o/token",
        json={
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': CLIENT_ID,
            'redirect_uri': REDIRECT_URI,
            'code_verifier': verifier
        }
    )
    return response.json()

def get_user_info(access_token):
    response = requests.get(
        f"{ISSUER}/o/userinfo",
        headers={'Authorization': f'Bearer {access_token}'}
    )
    return response.json()

# Usage
verifier = generate_code_verifier()
auth_url, state = get_authorization_url(verifier)
print(f"Visit: {auth_url}")
# After callback with 'code' parameter:
tokens = exchange_code('AUTHORIZATION_CODE', verifier)
user = get_user_info(tokens['access_token'])`;

  const curlCode = `# cURL Examples

# 1. Discovery
curl https://your-oidc-server.com/.well-known/openid-configuration

# 2. JWKS (public keys for JWT verification)
curl https://your-oidc-server.com/.well-known/jwks.json

# 3. Token exchange (without PKCE, confidential client)
curl -X POST https://your-oidc-server.com/o/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "redirect_uri": "https://yourapp.com/callback"
  }'

# 4. Token exchange (with PKCE, public client)
curl -X POST https://your-oidc-server.com/o/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTHORIZATION_CODE",
    "client_id": "your-client-id",
    "redirect_uri": "https://yourapp.com/callback",
    "code_verifier": "your-code-verifier"
  }'

# 5. Refresh token
curl -X POST https://your-oidc-server.com/o/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }'

# 6. Get user info
curl https://your-oidc-server.com/o/userinfo \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 7. Revoke token
curl -X POST https://your-oidc-server.com/o/revoke \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "YOUR_REFRESH_TOKEN",
    "token_type_hint": "refresh_token",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }'`;

  const [exampleTab, setExampleTab] = useState<'js' | 'python' | 'curl'>('js');

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Complete code examples for integrating with this OIDC server.
      </p>
      
      <div className="flex gap-2">
        <Button 
          variant={exampleTab === 'js' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setExampleTab('js')}
        >
          JavaScript/TypeScript
        </Button>
        <Button 
          variant={exampleTab === 'python' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setExampleTab('python')}
        >
          Python
        </Button>
        <Button 
          variant={exampleTab === 'curl' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setExampleTab('curl')}
        >
          cURL
        </Button>
      </div>
      
      <CodeBlock 
        code={exampleTab === 'js' ? jsCode : exampleTab === 'python' ? pythonCode : curlCode} 
        language={exampleTab === 'curl' ? 'bash' : exampleTab === 'python' ? 'python' : 'javascript'} 
      />
    </div>
  );
}

export function Docs() {
  const [activeTab, setActiveTab] = useState<Tab>("quickstart");

  const tabs: { id: Tab; label: string }[] = [
    { id: "quickstart", label: "Quick Start" },
    { id: "flow", label: "Auth Flow" },
    { id: "pkce", label: "PKCE" },
    { id: "api", label: "API Reference" },
    { id: "tokens", label: "Tokens" },
    { id: "examples", label: "Examples" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/o/authenticate" className="text-xl font-bold text-gray-900">
                OIDC Auth
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Developer Documentation</span>
            </div>
            <Link to="/o/authenticate">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <nav className="w-48 shrink-0">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <main className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                {activeTab === "quickstart" && <QuickStartSection />}
                {activeTab === "flow" && <FlowSection />}
                {activeTab === "pkce" && <PKCESection />}
                {activeTab === "api" && <APISection />}
                {activeTab === "tokens" && <TokensSection />}
                {activeTab === "examples" && <ExamplesSection />}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
