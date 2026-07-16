import { prisma } from "@/lib/prisma";
import { WorkOrderForm } from "@/components/WorkOrderForm";

export default async function NewWorkOrderPage() {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">New Work Order</h1>
      <WorkOrderForm mode="create" vendors={vendors} />
    </div>
  );
}
