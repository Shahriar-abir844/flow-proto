import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR_MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (workOrder.status !== "READY_FOR_OFFICE") {
    return NextResponse.json(
      { error: "Only work orders that are ready for office can be marked complete this way." },
      { status: 400 }
    );
  }

  await prisma.workOrder.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ ok: true });
}
