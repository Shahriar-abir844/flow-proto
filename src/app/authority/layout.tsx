import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { getSettings } from "@/lib/settings";

export default async function AuthorityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUTHORITY") {
    redirect("/login");
  }

  const settings = await getSettings();

  return (
    <div>
      <Nav role="AUTHORITY" name={session.user.name ?? session.user.username} brandName={settings.companyName ?? undefined} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
