import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const homeForRole: Record<string, string> = {
  AUTHORITY: "/authority",
  VENDOR_MANAGER: "/admin",
  VENDOR: "/vendor",
};

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(homeForRole[session.user.role] ?? "/login");
}
