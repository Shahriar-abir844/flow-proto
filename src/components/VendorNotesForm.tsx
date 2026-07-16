"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VendorNotesForm({
  workOrderId,
  initialNotes,
}: {
  workOrderId: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch(`/api/work-orders/${workOrderId}/notes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
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
    <div className="border border-neutral-200 rounded-lg bg-white p-4">
      <h2 className="text-sm font-medium mb-2">Notes / Comments</h2>
      <p className="text-xs text-neutral-500 mb-2">
        Add anything worth flagging — issues on site, what you did, questions, etc.
      </p>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="Type your notes here..."
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm mb-2"
      />
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
        {saved && !error && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </div>
  );
}
