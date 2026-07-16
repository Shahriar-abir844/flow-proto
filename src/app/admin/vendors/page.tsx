import { prisma } from "@/lib/prisma";
import { NewUserForm } from "@/components/NewUserForm";

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
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Username</th>
                <th className="px-4 py-2 font-medium">Assigned Work Orders</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">{v.name}</td>
                  <td className="px-4 py-3">{v.username}</td>
                  <td className="px-4 py-3">{v._count.assignedWorkOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
