import { prisma } from "@/lib/prisma";
import { NewUserForm } from "@/components/NewUserForm";
import { UserListTable } from "@/components/UserListTable";

export default async function AuthorityPage() {
  const managers = await prisma.user.findMany({
    where: { role: "VENDOR_MANAGER" },
    include: { _count: { select: { assignedWorkOrders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Vendor Managers</h1>
        <NewUserForm endpoint="/api/vendor-managers" entityLabel="Vendor Manager" />
      </div>

      {managers.length === 0 ? (
        <p className="text-sm text-neutral-500">No vendor managers yet.</p>
      ) : (
        <UserListTable
          users={managers.map((m) => ({
            id: m.id,
            name: m.name,
            username: m.username,
            email: m.email,
            phone: m.phone,
            address: m.address,
          }))}
          entityLabel="Vendor Manager"
          deleteEndpointBase="/api/vendor-managers"
        />
      )}
    </div>
  );
}
