import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReopenButton } from "@/components/ReopenButton";
import { MarkOfficeCompleteButton } from "@/components/MarkOfficeCompleteButton";

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  READY_FOR_OFFICE: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  READY_FOR_OFFICE: "Ready for Office",
  COMPLETED: "Completed",
};

export default async function ViewWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: { lineItems: true, uploads: true, vendor: true },
  });

  if (!workOrder) notFound();

  const total = workOrder.lineItems.reduce((sum, li) => sum + li.price, 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Work Orders
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-block rounded bg-neutral-900 text-white text-xs font-mono font-semibold px-2 py-1">
              {workOrder.workOrderNumber}
            </span>
            <h1 className="text-lg font-semibold">{workOrder.title}</h1>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusStyles[workOrder.status]}`}
            >
              {statusLabels[workOrder.status]}
            </span>
          </div>
          <p className="text-sm text-neutral-500">{workOrder.address}</p>
          <p className="text-sm text-neutral-500 mt-1">
            Vendor: {workOrder.vendor ? `${workOrder.vendor.name} (${workOrder.vendor.username})` : "Unassigned"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {workOrder.status === "READY_FOR_OFFICE" && (
            <MarkOfficeCompleteButton workOrderId={workOrder.id} />
          )}
          {(workOrder.status === "READY_FOR_OFFICE" || workOrder.status === "COMPLETED") && (
            <ReopenButton workOrderId={workOrder.id} />
          )}
          <Link
            href={`/admin/work-orders/${workOrder.id}/invoice`}
            className="rounded-md border border-neutral-300 text-sm px-4 py-2 hover:bg-neutral-50 whitespace-nowrap"
          >
            Invoice
          </Link>
          <Link
            href={`/admin/work-orders/${workOrder.id}/edit`}
            className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 whitespace-nowrap"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-lg bg-white p-4">
        <h2 className="text-sm font-medium mb-2">Property Information</h2>
        <p className="text-sm whitespace-pre-wrap text-neutral-700">{workOrder.instructions}</p>
      </div>

      {workOrder.pdfPath && (
        <div className="border border-neutral-200 rounded-lg bg-white p-4">
          <h2 className="text-sm font-medium mb-2">Instruction PDF</h2>
          <a
            href={`/api/work-orders/${workOrder.id}/pdf`}
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            {workOrder.pdfName ?? "View PDF"}
          </a>
        </div>
      )}

      <div className="border border-neutral-200 rounded-lg bg-white p-4">
        <h2 className="text-sm font-medium mb-2">Work &amp; Pricing</h2>
        <div className="divide-y divide-neutral-100">
          {workOrder.lineItems.map((li) => (
            <div key={li.id} className="py-2">
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm">{li.description}</span>
                <span className="text-sm whitespace-nowrap">${li.price.toFixed(2)}</span>
              </div>
              {li.instructions && (
                <p className="text-xs text-neutral-500 whitespace-pre-wrap mt-1">
                  {li.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-neutral-200 font-medium pt-2 mt-2">
          <span className="text-sm">Total</span>
          <span className="text-sm">${total.toFixed(2)}</span>
        </div>
      </div>

      {workOrder.vendorNotes && (
        <div className="border border-neutral-200 rounded-lg bg-white p-4">
          <h2 className="text-sm font-medium mb-2">Vendor Notes / Comments</h2>
          <p className="text-sm whitespace-pre-wrap text-neutral-700">{workOrder.vendorNotes}</p>
        </div>
      )}

      <div className="border border-neutral-200 rounded-lg bg-white p-4">
        <h2 className="text-sm font-medium mb-2">
          Photos / Documents ({workOrder.uploads.length})
        </h2>
        {workOrder.driveFolderUrl && (
          <p className="text-xs text-neutral-500 mb-2">
            Folder:{" "}
            {workOrder.driveFolderUrl.startsWith("local://") ? (
              <span>{workOrder.driveFolderUrl.replace("local://", "")} (local storage)</span>
            ) : (
              <a
                href={workOrder.driveFolderUrl}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                Open in Google Drive
              </a>
            )}
          </p>
        )}
        {workOrder.uploads.length === 0 ? (
          <p className="text-sm text-neutral-500">No uploads yet.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {workOrder.uploads.map((u) => (
              <li key={u.id}>
                {u.driveFileId ? (
                  <a href={u.path} target="_blank" className="text-blue-600 hover:underline">
                    {u.fileName}
                  </a>
                ) : (
                  <a
                    href={`/api/uploads/${u.id}/file`}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {u.fileName}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
