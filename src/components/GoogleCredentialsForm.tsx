"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GoogleCredentialsForm({
  clientIdSet,
  clientSecretSet,
  refreshTokenSet,
}: {
  clientIdSet: boolean;
  clientSecretSet: boolean;
  refreshTokenSet: boolean;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/settings/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, refreshToken }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setClientId("");
    setClientSecret("");
    setRefreshToken("");
    setSaved(true);
    router.refresh();
  };

  const handleClear = async () => {
    if (!confirm("Remove the saved Google OAuth credentials? Uploads will fall back to local storage.")) {
      return;
    }
    setClearing(true);
    setError("");
    const res = await fetch("/api/settings/google", { method: "DELETE" });
    setClearing(false);
    if (!res.ok) {
      setError("Failed to clear credentials.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4 max-w-2xl">
      <h2 className="text-sm font-medium mb-1">Google OAuth Credentials</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Paste these in directly — nothing here is ever sent anywhere except saved to this
        app&rsquo;s database. Fields already set are shown as filled below; leave a field blank
        to keep its current value. See <code>GOOGLE_DRIVE_SETUP.md</code> for how to get each
        one.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">
            Client ID {clientIdSet && <span className="text-green-700">(currently set)</span>}
          </label>
          <input
            type="password"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={clientIdSet ? "•••••••••••• (leave blank to keep)" : "e.g. 123abc.apps.googleusercontent.com"}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Client Secret {clientSecretSet && <span className="text-green-700">(currently set)</span>}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={clientSecretSet ? "•••••••••••• (leave blank to keep)" : "GOCSPX-..."}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Refresh Token {refreshTokenSet && <span className="text-green-700">(currently set)</span>}
          </label>
          <input
            type="password"
            value={refreshToken}
            onChange={(e) => setRefreshToken(e.target.value)}
            placeholder={refreshTokenSet ? "•••••••••••• (leave blank to keep)" : "1//0g..."}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-green-700">Saved.</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {(clientIdSet || clientSecretSet || refreshTokenSet) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="text-sm text-red-500 hover:text-red-700"
            >
              {clearing ? "Clearing..." : "Clear saved credentials"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
