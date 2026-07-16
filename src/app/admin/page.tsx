import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

type View = "open" | "rfo" | "completed" | "all";

const whereForView: Record<View, object> = {
  open: { status: "OPEN" },
  rfo: { status: "READY_FOR_OFFICE" },
  completed: { status: "COMPLETED" },
  all: {},
};

const emptyMessage: Record<View, string> = {
  open: "No open work orders.",
  rfo: "Nothing ready for office right now.",
  completed: "No completed work orders yet.",
  all: "No work orders yet.",
};

export default async function AdminWorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view: View =
    rawView === "rfo" || rawView === "completed" || rawView === "all" ? rawView : "open";

  const workOrders = await prisma.workOrder.findMany({
    where: whereForView[view],
    include: { vendor: true, lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  const tabs: { key: View; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "rfo", label: "Ready for Office" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Work Orders</h1>
        <Link
          href="/admin/work-orders/new"
          className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800"
        >
          + New Work Order
        </Link>
      </div>

      <div className="flex gap-4 mb-4 border-b border-neutral-200">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "open" ? "/admin" : `/admin?view=${tab.key}`}
            className={`text-sm pb-2 -mb-px border-b-2 whitespace-nowrap ${
              view === tab.key
                ? "border-neutral-900 text-neutral-900 font-medium"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {workOrders.length === 0 ? (
        <p className="text-sm text-neutral-500">{emptyMessage[view]}</p>
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Work Order #</th>
                <th className="px-4 py-2 font-medium">Address</th>
                <th className="px-4 py-2 font-medium">Vendor</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Total Price</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => {
                const total = wo.lineItems.reduce((sum, li) => sum + li.price, 0);
                return (
                  <tr key={wo.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/work-orders/${wo.id}`} className="font-mono text-xs font-semibold">
                        {wo.workOrderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/work-orders/${wo.id}`} className="block">
                        <div className="font-medium text-neutral-900">{wo.title}</div>
                        <div className="text-neutral-500">{wo.address}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{wo.vendor?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusStyles[wo.status]}`}>
                        {statusLabels[wo.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">${total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/work-orders/${wo.id}`} className="text-neutral-600 hover:text-neutral-900">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
