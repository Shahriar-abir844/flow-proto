"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  assignedWorkOrderCount?: number;
};

export function UserListTable({
  users,
  entityLabel,
  deleteEndpointBase,
  showAssignedCount,
}: {
  users: UserRow[];
  entityLabel: string;
  deleteEndpointBase: string;
  showAssignedCount?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Delete ${entityLabel.toLowerCase()} "${selected.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    const res = await fetch(`${deleteEndpointBase}/${selected.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      return;
    }
    setSelected(null);
    router.refresh();
  };

  return (
    <>
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Username</th>
              {showAssignedCount && <th className="px-4 py-2 font-medium">Assigned Work Orders</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => {
                  setError("");
                  setSelected(u);
                }}
                className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer"
              >
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.username}</td>
                {showAssignedCount && <td className="px-4 py-3">{u.assignedWorkOrderCount ?? 0}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-neutral-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-neutral-500 font-mono">{selected.username}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-neutral-400 hover:text-neutral-900 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-neutral-500">Email: </span>
                {selected.email ?? "—"}
              </div>
              <div>
                <span className="text-neutral-500">Phone: </span>
                {selected.phone ?? "—"}
              </div>
              <div>
                <span className="text-neutral-500">Address: </span>
                {selected.address ?? "—"}
              </div>
              {showAssignedCount && (
                <div>
                  <span className="text-neutral-500">Assigned Work Orders: </span>
                  {selected.assignedWorkOrderCount ?? 0}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-end pt-2 border-t border-neutral-100">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : `Delete ${entityLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
