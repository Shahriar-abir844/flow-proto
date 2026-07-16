import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { getSettings } from "@/lib/settings";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    redirect("/login");
  }

  const settings = await getSettings();

  return (
    <div>
      <Nav role="VENDOR" name={session.user.name ?? session.user.username} brandName={settings.companyName ?? undefined} />
      {settings.supportContact && (
        <div className="bg-neutral-100 border-b border-neutral-200 print:hidden">
          <div className="max-w-5xl mx-auto px-4 py-1.5 text-xs text-neutral-500">
            Need help? Contact {settings.supportContact}
          </div>
        </div>
      )}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
