"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkReadyButton({
  workOrderId,
  status,
  hasUploads,
}: {
  workOrderId: string;
  status: string;
  hasUploads: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (status === "READY_FOR_OFFICE") {
    return (
      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
        ✓ Marked ready for office. Your vendor manager will review and submit it.
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
        ✓ Completed.
      </div>
    );
  }

  const handleMarkReady = async () => {
    if (
      !confirm(
        "Mark this work order ready for office? Make sure all required photos and notes are in — you won't be able to make changes after this."
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch(`/api/work-orders/${workOrderId}/mark-ready`, { method: "POST" });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4">
      <button
        onClick={handleMarkReady}
        disabled={!hasUploads || saving}
        className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Marking ready..." : "Mark Ready for Office"}
      </button>
      {!hasUploads && (
        <p className="text-xs text-neutral-500 mt-2">
          Upload at least one photo or document before you can mark this ready.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
