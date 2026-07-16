"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SiteInfoForm({
  initialCompanyName,
  initialSupportContact,
}: {
  initialCompanyName: string;
  initialSupportContact: string;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [supportContact, setSupportContact] = useState(initialSupportContact);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/settings/site-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, supportContact }),
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
      <h2 className="text-sm font-medium mb-1">Site Info</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Shown to Vendor Managers and Vendors so the site feels consistent and they know who to
        reach if something goes wrong.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1">Company / Business Name</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Shown in the nav bar and on invoices"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Support Contact</label>
          <input
            value={supportContact}
            onChange={(e) => setSupportContact(e.target.value)}
            placeholder="Phone number or email vendors can reach if they have questions"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

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
