import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder || !workOrder.pdfPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.user.role === "VENDOR" && workOrder.vendorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readLocalFile(workOrder.pdfPath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${workOrder.pdfName ?? "document.pdf"}"`,
    },
  });
}
