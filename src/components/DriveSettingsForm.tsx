"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DriveStatus = {
  clientIdSet: boolean;
  clientSecretSet: boolean;
  refreshTokenSet: boolean;
  oauthConfigured: boolean;
  folderConfigured: boolean;
  active: boolean;
};

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-green-700" : "text-neutral-500"}`}>
      <span>{ok ? "✓" : "○"}</span>
      <span>{label}</span>
    </li>
  );
}

export function DriveSettingsForm({
  initialLink,
  driveStatus,
}: {
  initialLink: string;
  driveStatus: DriveStatus;
}) {
  const router = useRouter();
  const [link, setLink] = useState(initialLink);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driveFolderLink: link }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4 max-w-2xl">
      <h2 className="text-sm font-medium mb-1">Google Drive Folder</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Paste the link to the Google Drive folder where per-work-order subfolders and vendor
        uploads should go. You can change this any time — it takes effect on the next folder
        created.
      </p>

      <div
        className={`rounded-md border px-3 py-3 mb-3 ${
          driveStatus.active
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <p
          className={`text-xs font-medium mb-2 ${
            driveStatus.active ? "text-green-800" : "text-amber-800"
          }`}
        >
          {driveStatus.active
            ? "Google Drive is active — uploads go straight to Drive."
            : "Google Drive is NOT active yet — uploads are still going to local storage on the server."}
        </p>
        <ul className="text-xs space-y-1">
          <StatusRow ok={driveStatus.clientIdSet} label="Client ID set (below)" />
          <StatusRow ok={driveStatus.clientSecretSet} label="Client Secret set (below)" />
          <StatusRow ok={driveStatus.refreshTokenSet} label="Refresh Token set (below)" />
          <StatusRow ok={driveStatus.folderConfigured} label="Destination folder link set below" />
        </ul>
        {!driveStatus.oauthConfigured && (
          <p className="text-xs text-amber-800 mt-2">
            The folder link alone isn&rsquo;t enough — the Client ID, Client Secret, and
            Refresh Token below also need to be filled in. See{" "}
            <code>GOOGLE_DRIVE_SETUP.md</code> for how to get them.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-green-700">Saved.</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
