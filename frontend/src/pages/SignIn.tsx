import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { signIn } from "@/lib/api";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Carry OAuth params through the form
  const oauthParams = {
    client_id: params.get("client_id") ?? undefined,
    redirect_uri: params.get("redirect_uri") ?? undefined,
    scope: params.get("scope") ?? undefined,
    state: params.get("state") ?? undefined,
    code_challenge: params.get("code_challenge") ?? undefined,
    code_challenge_method: params.get("code_challenge_method") ?? undefined,
  };

  const hasOAuth = !!oauthParams.client_id;

  useEffect(() => {
    setError("");
    setUnverified(false);
  }, [email, password]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnverified(false);
    try {
      const res = await signIn({ email, password, ...oauthParams });
      if (res.redirect) {
        window.location.href = res.redirect;
      } else if (res.token) {
        setToken(res.token);
        navigate("/applications");
      }
    } catch (err: unknown) {
      const e = err as { error?: string; message?: string };
      if (e.error === "email_not_verified") {
        setUnverified(true);
      } else {
        setError(e.message ?? e.error ?? "Sign in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title={hasOAuth ? "Sign in to continue" : "Sign in"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {unverified && (
          <Alert variant="destructive">
            <AlertDescription>
              Please verify your email before signing in.{" "}
              <Link
                to={`/o/verify-email?resend=1&email=${encodeURIComponent(email)}`}
                className="underline font-medium"
              >
                Resend verification
              </Link>
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-900">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-center text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-gray-900 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
