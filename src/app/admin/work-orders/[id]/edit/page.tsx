import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkOrderForm } from "@/components/WorkOrderForm";

export default async function EditWorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [workOrder, vendors] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: { lineItems: true },
    }),
    prisma.user.findMany({ where: { role: "VENDOR" }, orderBy: { name: "asc" } }),
  ]);

  if (!workOrder) notFound();

  return (
    <div>
      <Link
        href={`/admin/work-orders/${workOrder.id}`}
        className="text-sm text-neutral-500 hover:text-neutral-900 mb-4 inline-block"
      >
        ← Back to work order
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold">Edit Work Order</h1>
        <span className="inline-block rounded bg-neutral-900 text-white text-xs font-mono font-semibold px-2 py-1">
          {workOrder.workOrderNumber}
        </span>
      </div>
      <WorkOrderForm
        mode="edit"
        workOrderId={workOrder.id}
        vendors={vendors}
        initial={{
          title: workOrder.title,
          address: workOrder.address,
          instructions: workOrder.instructions,
          vendorId: workOrder.vendorId,
          status: workOrder.status,
          lineItems: workOrder.lineItems.map((li) => ({
            description: li.description,
            price: li.price,
            instructions: li.instructions ?? "",
          })),
          pdfName: workOrder.pdfName,
        }}
      />
    </div>
  );
}
