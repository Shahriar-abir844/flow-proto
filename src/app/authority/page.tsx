import { prisma } from "@/lib/prisma";
import { NewUserForm } from "@/components/NewUserForm";

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
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Username</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3">{m.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
