import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { getApplications, deleteApplication, type Application } from "@/lib/api";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

export function ApplicationList() {
  const [apps, setApps] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { clearToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getApplications()
      .then(setApps)
      .catch(() => setError("Failed to load applications."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(clientId: string) {
    if (!confirm("Delete this application?")) return;
    await deleteApplication(clientId);
    setApps((prev) => prev.filter((a) => a.clientId !== clientId));
  }

  function handleSignOut() {
    clearToken();
    navigate("/o/authenticate");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">OIDC Auth</h1>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">OAuth Applications</h2>
          <Link to="/applications/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New application
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : apps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500 text-sm">
              No applications yet.{" "}
              <Link to="/applications/new" className="underline font-medium text-gray-900">
                Create one
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <Card key={app.clientId}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">{app.displayName}</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5 font-mono">{app.clientId}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/applications/${app.clientId}/edit`}>
                        <Button variant="outline" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(app.clientId)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <a
                      href={app.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {app.applicationUrl}
                    </a>
                    <span className="truncate">Redirect: {app.redirectUrl}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
