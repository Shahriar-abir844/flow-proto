import { prisma } from "@/lib/prisma";
import { NewUserForm } from "@/components/NewUserForm";
import { UserListTable } from "@/components/UserListTable";

export default async function VendorsPage() {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR" },
    include: { _count: { select: { assignedWorkOrders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Vendors</h1>
        <NewUserForm endpoint="/api/vendors" entityLabel="Vendor" />
      </div>

      {vendors.length === 0 ? (
        <p className="text-sm text-neutral-500">No vendors yet.</p>
      ) : (
        <UserListTable
          users={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            username: v.username,
            email: v.email,
            phone: v.phone,
            address: v.address,
            assignedWorkOrderCount: v._count.assignedWorkOrders,
          }))}
          entityLabel="Vendor"
          deleteEndpointBase="/api/vendors"
          showAssignedCount
        />
      )}
    </div>
  );
}
