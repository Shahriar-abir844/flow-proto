import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFileToFolder } from "@/lib/storage";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  if (!workOrder.driveFolderId) {
    return NextResponse.json({ error: "Folder not created yet" }, { status: 400 });
  }

  const form = await req.formData();
  const files = form.getAll("files") as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const created = [];
  for (const file of files) {
    if (file.size === 0) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFileToFolder(
      workOrder.driveFolderId,
      file.name,
      buffer,
      file.type || "application/octet-stream"
    );
    const upload = await prisma.upload.create({
      data: {
        fileName: file.name,
        path: uploaded.path,
        driveFileId: uploaded.driveFileId,
        workOrderId: id,
      },
    });
    created.push(upload);
  }

  return NextResponse.json({ uploads: created });
}
