import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uploadId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { uploadId } = await params;

  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: { workOrder: true },
  });
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.user.role === "VENDOR" && upload.workOrder.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (upload.driveFileId) {
    return NextResponse.json({ error: "File is stored in Google Drive" }, { status: 400 });
  }

  const buffer = await readLocalFile(upload.path);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `inline; filename="${upload.fileName}"`,
    },
  });
}
