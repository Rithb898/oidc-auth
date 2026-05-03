import { useState } from "react";
import { Link } from "react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    await forgotPassword(email).catch(() => null);
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <AuthCard title="Check your email">
        <p className="text-sm text-gray-600">
          If an account exists for <strong>{email}</strong>, a password reset
          link has been sent. Check your inbox.
        </p>
        <p className="mt-4 text-sm text-center">
          <Link to="/o/authenticate" className="text-gray-500 hover:text-gray-900 underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          Enter your email and we'll send you a reset link.
        </p>
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
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
