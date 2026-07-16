"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LineItem = { description: string; price: number; instructions: string };
type Vendor = { id: string; name: string; username: string };

export function WorkOrderForm({
  vendors,
  mode,
  workOrderId,
  initial,
}: {
  vendors: Vendor[];
  mode: "create" | "edit";
  workOrderId?: string;
  initial?: {
    title: string;
    address: string;
    instructions: string;
    vendorId: string | null;
    status: string;
    lineItems: LineItem[];
    pdfName: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [vendorId, setVendorId] = useState(initial?.vendorId ?? "");
  const [status, setStatus] = useState(initial?.status ?? "OPEN");
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initial?.lineItems && initial.lineItems.length > 0
      ? initial.lineItems
      : [{ description: "", price: 0, instructions: "" }]
  );
  const [pdf, setPdf] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) =>
      prev.map((li, i) =>
        i === index ? { ...li, [field]: field === "price" ? Number(value) : value } : li
      )
    );
  };

  const addLineItem = () =>
    setLineItems((prev) => [...prev, { description: "", price: 0, instructions: "" }]);
  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("address", address);
    formData.set("instructions", instructions);
    formData.set("vendorId", vendorId);
    formData.set("status", status);
    formData.set("lineItems", JSON.stringify(lineItems));
    if (pdf) formData.set("pdf", pdf);

    const url = mode === "create" ? "/api/work-orders" : `/api/work-orders/${workOrderId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, { method, body: formData });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    if (mode === "create") {
      const data = await res.json();
      router.push(`/admin/work-orders/${data.id}`);
    } else {
      router.push(`/admin/work-orders/${workOrderId}`);
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!workOrderId) return;
    if (!confirm("Delete this work order? This cannot be undone.")) return;
    setSaving(true);
    const res = await fetch(`/api/work-orders/${workOrderId}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to delete.");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            placeholder="e.g. Winterization"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Property Address</label>
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            placeholder="123 Main St, City, ST"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Information</label>
        <p className="text-xs text-neutral-500 mb-1">
          General info about the property — lot size, lockbox code, access notes, etc. For
          instructions on a specific piece of work, use the line items below instead.
        </p>
        <textarea
          required
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Lot size, lockbox code, access notes..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Assign Vendor</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.username})
              </option>
            ))}
          </select>
        </div>

        {mode === "edit" && (
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="OPEN">Open</option>
              <option value="READY_FOR_OFFICE">Ready for Office</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Instruction PDF (optional)</label>
        {initial?.pdfName && !pdf && (
          <p className="text-xs text-neutral-500 mb-1">Current file: {initial.pdfName}</p>
        )}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Line Items</label>
          <button
            type="button"
            onClick={addLineItem}
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-3">
          {lineItems.map((li, i) => (
            <div key={i} className="border border-neutral-200 rounded-md p-3 bg-white space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1">Description</label>
                  <input
                    value={li.description}
                    onChange={(e) => updateLineItem(i, "description", e.target.value)}
                    placeholder="e.g. Lawn mowing"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-neutral-500 mb-1">Price ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={li.price}
                      onChange={(e) => updateLineItem(i, "price", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-md border border-neutral-300 pl-6 pr-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeLineItem(i)}
                  className="text-sm text-red-500 hover:text-red-700 px-2 pb-2"
                >
                  Remove
                </button>
              </div>
              <textarea
                value={li.instructions}
                onChange={(e) => updateLineItem(i, "instructions", e.target.value)}
                placeholder="Instructions specific to this line item (optional)"
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Work Order" : "Save Changes"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete Work Order
          </button>
        )}
      </div>
    </form>
  );
}
