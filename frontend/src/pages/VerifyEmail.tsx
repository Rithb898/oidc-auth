import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { verifyEmail, resendVerification } from "@/lib/api";
import { CheckCircle, XCircle } from "lucide-react";

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const shouldResend = params.get("resend") === "1";
  const prefillEmail = params.get("email") ?? "";

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState(prefillEmail);
  const [resendDone, setResendDone] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setErrorMsg((err as { error?: string }).error ?? "Verification failed");
        setStatus("error");
      });
  }, [token]);

  async function handleResend(e: React.SyntheticEvent) {
    e.preventDefault();
    setResendLoading(true);
    await resendVerification(resendEmail).catch(() => null);
    setResendDone(true);
    setResendLoading(false);
  }

  // No token — show resend form
  if (!token || shouldResend) {
    if (resendDone) {
      return (
        <AuthCard title="Verification email sent">
          <p className="text-sm text-gray-600">
            If <strong>{resendEmail}</strong> has an unverified account, a new
            link is on its way. Check your inbox.
          </p>
        </AuthCard>
      );
    }
    return (
      <AuthCard title="Resend verification email">
        <form onSubmit={handleResend} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={resendLoading}>
            {resendLoading ? "Sending…" : "Resend verification email"}
          </Button>
          <p className="text-sm text-center">
            <Link to="/o/authenticate" className="text-gray-500 hover:text-gray-900">
              Back to sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    );
  }

  if (status === "pending") {
    return <AuthCard title="Verifying…"><p className="text-sm text-gray-500">Please wait.</p></AuthCard>;
  }

  if (status === "success") {
    return (
      <AuthCard title="Email verified">
        <div className="flex flex-col items-center gap-4 py-2">
          <CheckCircle className="text-green-500 w-12 h-12" />
          <p className="text-sm text-gray-600 text-center">
            Your email is verified. You can now sign in.
          </p>
          <Link to="/o/authenticate">
            <Button className="w-full">Sign in</Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Verification failed">
      <div className="flex flex-col items-center gap-4 py-2">
        <XCircle className="text-red-500 w-12 h-12" />
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
        <Link to="/o/verify-email">
          <Button variant="outline">Request new link</Button>
        </Link>
      </div>
    </AuthCard>
  );
}
