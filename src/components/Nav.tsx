"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type AppRole = "AUTHORITY" | "VENDOR_MANAGER" | "VENDOR";

const linksByRole: Record<AppRole, { href: string; label: string }[]> = {
  AUTHORITY: [
    { href: "/authority", label: "Vendor Managers" },
    { href: "/authority/settings", label: "Settings" },
  ],
  VENDOR_MANAGER: [
    { href: "/admin", label: "Work Orders" },
    { href: "/admin/vendors", label: "Vendors" },
  ],
  VENDOR: [{ href: "/vendor", label: "My Work Orders" }],
};

export function Nav({
  role,
  name,
  brandName,
}: {
  role: AppRole;
  name: string;
  brandName?: string;
}) {
  const pathname = usePathname();
  const links = linksByRole[role];

  return (
    <header className="border-b border-neutral-200 bg-white print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-sm">{brandName || "Flow"}</span>
          <nav className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm ${
                  pathname === link.href
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
