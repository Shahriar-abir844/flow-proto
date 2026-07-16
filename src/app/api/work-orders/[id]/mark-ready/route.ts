import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: { _count: { select: { uploads: true } } },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (workOrder.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (workOrder.status !== "OPEN") {
    return NextResponse.json({ error: "This work order can't be marked ready right now." }, { status: 400 });
  }
  if (workOrder._count.uploads === 0) {
    return NextResponse.json(
      { error: "Upload at least one photo or document before marking this ready for office." },
      { status: 400 }
    );
  }

  await prisma.workOrder.update({
    where: { id },
    data: { status: "READY_FOR_OFFICE" },
  });

  return NextResponse.json({ ok: true });
}
