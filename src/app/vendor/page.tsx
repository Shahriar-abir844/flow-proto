import Link from "next/link";
import { auth } from "@/lib/auth";
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

type View = "open" | "submitted";

export default async function VendorWorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const view: View = rawView === "submitted" ? "submitted" : "open";

  const session = await auth();
  const workOrders = await prisma.workOrder.findMany({
    where: {
      vendorId: session!.user.id,
      status: view === "submitted" ? { in: ["READY_FOR_OFFICE", "COMPLETED"] } : "OPEN",
    },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  const tabs: { key: View; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "submitted", label: "Submitted" },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">My Work Orders</h1>

      <div className="flex gap-4 mb-4 border-b border-neutral-200">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "open" ? "/vendor" : `/vendor?view=${tab.key}`}
            className={`text-sm pb-2 -mb-px border-b-2 ${
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
        <p className="text-sm text-neutral-500">
          {view === "open" ? "No open work orders." : "No submitted work orders yet."}
        </p>
      ) : (
        <div className="grid gap-3">
          {workOrders.map((wo) => {
            const total = wo.lineItems.reduce((sum, li) => sum + li.price, 0);
            return (
              <Link
                key={wo.id}
                href={`/vendor/work-orders/${wo.id}`}
                className="border border-neutral-200 rounded-lg bg-white p-4 hover:border-neutral-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-neutral-400">{wo.workOrderNumber}</span>
                      <span className="font-medium">{wo.title}</span>
                    </div>
                    <div className="text-sm text-neutral-500">{wo.address}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${total.toFixed(2)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[wo.status]}`}
                    >
                      {statusLabels[wo.status]}
                    </span>
                    <span className="text-neutral-300">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
