import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (workOrder.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (workOrder.status !== "OPEN") {
    return NextResponse.json(
      { error: "This work order is no longer editable." },
      { status: 400 }
    );
  }

  const { notes } = await req.json();

  await prisma.workOrder.update({
    where: { id },
    data: { vendorNotes: (notes ?? "").trim() || null },
  });

  return NextResponse.json({ ok: true });
}
