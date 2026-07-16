import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setSiteInfo } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyName, supportContact } = await req.json();

  await setSiteInfo({
    companyName: (companyName ?? "").trim() || null,
    supportContact: (supportContact ?? "").trim() || null,
  });

  return NextResponse.json({ ok: true });
}
