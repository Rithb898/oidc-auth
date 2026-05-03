import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getApplication,
  createApplication,
  updateApplication,
} from "@/lib/api";
import { ArrowLeft, Copy, Check } from "lucide-react";

export function ApplicationForm() {
  const { clientId } = useParams<{ clientId?: string }>();
  const isEdit = !!clientId;
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{ clientId: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isEdit || !clientId) return;
    getApplication(clientId)
      .then((app) => {
        setDisplayName(app.displayName);
        setApplicationUrl(app.applicationUrl);
        setRedirectUrl(app.redirectUrl);
      })
      .catch(() => setError("Failed to load application."));
  }, [clientId, isEdit]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit && clientId) {
        await updateApplication(clientId, { displayName, applicationUrl, redirectUrl });
        navigate("/applications");
      } else {
        const res = await createApplication({ displayName, applicationUrl, redirectUrl });
        setCreatedSecret({ clientId: res.clientId, secret: res.clientSecret });
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Application created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription className="text-sm">
                  Copy your client secret now — it won't be shown again.
                </AlertDescription>
              </Alert>
              <div className="space-y-1.5">
                <Label>Client ID</Label>
                <Input readOnly value={createdSecret.clientId} className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Client Secret</Label>
                <div className="flex gap-2">
                  <Input readOnly value={createdSecret.secret} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate("/applications")}>
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Applications
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? "Edit application" : "New application"}
        </h2>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="My App"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="applicationUrl">Application URL</Label>
                <Input
                  id="applicationUrl"
                  type="url"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="https://myapp.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="redirectUrl">Redirect URL</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://myapp.com/callback"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : isEdit ? "Save changes" : "Create application"}
                </Button>
                <Link to="/applications">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
