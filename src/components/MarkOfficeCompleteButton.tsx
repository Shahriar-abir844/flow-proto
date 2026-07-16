"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkOfficeCompleteButton({ workOrderId }: { workOrderId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    if (!confirm("Mark this work order complete? Only do this once it's been submitted in the client portal.")) {
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch(`/api/work-orders/${workOrderId}/mark-complete`, { method: "POST" });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleComplete}
        disabled={saving}
        className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50 whitespace-nowrap"
      >
        {saving ? "Marking complete..." : "Mark Complete"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
