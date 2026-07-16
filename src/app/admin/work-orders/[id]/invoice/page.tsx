import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/PrintButton";

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  READY_FOR_OFFICE: "Ready for Office",
  COMPLETED: "Completed",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [workOrder, settings] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: { lineItems: true, vendor: true },
    }),
    getSettings(),
  ]);

  if (!workOrder) notFound();

  const total = workOrder.lineItems.reduce((sum, li) => sum + li.price, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/admin/work-orders/${workOrder.id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to work order
        </Link>
        <PrintButton />
      </div>

      <div className="border border-neutral-200 rounded-lg bg-white p-8 print:border-none print:p-0">
        <div className="flex items-start justify-between mb-8">
          <div>
            {settings.companyName && (
              <p className="text-sm font-medium text-neutral-500 mb-1">{settings.companyName}</p>
            )}
            <h1 className="text-2xl font-semibold">Invoice</h1>
            <p className="text-sm text-neutral-500 font-mono">{workOrder.workOrderNumber}</p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <p>{new Date(workOrder.createdAt).toLocaleDateString()}</p>
            <p className="mt-1">{statusLabels[workOrder.status]}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-neutral-500 mb-1">Property</p>
            <p className="font-medium">{workOrder.title}</p>
            <p>{workOrder.address}</p>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">Vendor</p>
            <p className="font-medium">{workOrder.vendor?.name ?? "Unassigned"}</p>
            {workOrder.vendor && <p>{workOrder.vendor.username}</p>}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-neutral-500">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {workOrder.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-neutral-100">
                <td className="py-2">{li.description}</td>
                <td className="py-2 text-right whitespace-nowrap">${li.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-48 flex items-center justify-between font-semibold text-sm border-t border-neutral-300 pt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
