import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateResetToken, resetPassword } from "@/lib/api";
import { CheckCircle } from "lucide-react";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [valid, setValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setValid(false); setTokenError("No reset token provided."); return; }
    validateResetToken(token)
      .then(() => setValid(true))
      .catch((err: unknown) => {
        setValid(false);
        setTokenError((err as { error?: string }).error ?? "Invalid or expired reset link.");
      });
  }, [token]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/o/authenticate"), 3000);
    } catch (err: unknown) {
      setError((err as { error?: string }).error ?? "Reset failed. Please request a new link.");
    } finally {
      setLoading(false);
    }
  }

  if (valid === null) {
    return <AuthCard title="Validating link…"><p className="text-sm text-gray-500">Please wait.</p></AuthCard>;
  }

  if (!valid) {
    return (
      <AuthCard title="Invalid reset link">
        <Alert variant="destructive">
          <AlertDescription>{tokenError}</AlertDescription>
        </Alert>
        <p className="mt-4 text-sm text-center">
          <Link to="/forgot-password" className="underline text-gray-900">
            Request a new link
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password reset">
        <div className="flex flex-col items-center gap-4 py-2">
          <CheckCircle className="text-green-500 w-12 h-12" />
          <p className="text-sm text-gray-600 text-center">
            Your password has been reset. Redirecting to sign in…
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthCard>
  );
}
