"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReopenButton({ workOrderId }: { workOrderId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleReopen = async () => {
    if (
      !confirm(
        "Reopen this work order? It will go back to the vendor's queue and they'll be able to upload photos and notes again."
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch(`/api/work-orders/${workOrderId}/reopen`, { method: "POST" });
    setSaving(false);

    if (!res.ok) {
      setError("Failed to reopen.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleReopen}
        disabled={saving}
        className="rounded-md border border-neutral-300 text-sm px-4 py-2 hover:bg-neutral-50 whitespace-nowrap disabled:opacity-50"
      >
        {saving ? "Reopening..." : "Reopen"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
