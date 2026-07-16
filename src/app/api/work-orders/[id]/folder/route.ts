import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureWorkOrderFolder } from "@/lib/storage";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.user.role === "VENDOR") {
    if (workOrder.vendorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (workOrder.status !== "OPEN") {
      return NextResponse.json({ error: "This work order is no longer editable." }, { status: 400 });
    }
  }

  if (workOrder.driveFolderId) {
    return NextResponse.json({
      folderId: workOrder.driveFolderId,
      folderUrl: workOrder.driveFolderUrl,
    });
  }

  const folderLabel = `${workOrder.workOrderNumber} - ${workOrder.address}`;
  const { folderId, folderUrl } = await ensureWorkOrderFolder(workOrder.id, folderLabel);

  await prisma.workOrder.update({
    where: { id },
    data: { driveFolderId: folderId, driveFolderUrl: folderUrl },
  });

  return NextResponse.json({ folderId, folderUrl });
}
