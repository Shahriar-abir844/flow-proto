import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setGoogleCredentials, clearGoogleCredentials } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, clientSecret, refreshToken } = await req.json();

  await setGoogleCredentials({
    clientId: (clientId ?? "").trim(),
    clientSecret: (clientSecret ?? "").trim(),
    refreshToken: (refreshToken ?? "").trim(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearGoogleCredentials();
  return NextResponse.json({ ok: true });
}
