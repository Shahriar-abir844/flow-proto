import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePdf } from "@/lib/storage";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR_MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const form = await req.formData();
  const title = form.get("title") as string;
  const address = form.get("address") as string;
  const instructions = form.get("instructions") as string;
  const vendorId = (form.get("vendorId") as string) || null;
  const status = form.get("status") as string;
  const lineItemsRaw = form.get("lineItems") as string;
  const pdf = form.get("pdf") as File | null;

  let lineItems: { description: string; price: number; instructions?: string }[] = [];
  try {
    lineItems = JSON.parse(lineItemsRaw || "[]");
  } catch {
    return NextResponse.json({ error: "Invalid line items" }, { status: 400 });
  }

  await prisma.workOrderLineItem.deleteMany({ where: { workOrderId: id } });

  await prisma.workOrder.update({
    where: { id },
    data: {
      title,
      address,
      instructions,
      vendorId: vendorId || null,
      status: status as "OPEN" | "READY_FOR_OFFICE" | "COMPLETED",
      lineItems: {
        create: lineItems
          .filter((li) => li.description)
          .map((li) => ({
            description: li.description,
            price: Number(li.price) || 0,
            instructions: li.instructions || null,
          })),
      },
    },
  });

  if (pdf && pdf.size > 0) {
    const buffer = Buffer.from(await pdf.arrayBuffer());
    const pdfPath = await savePdf(id, pdf.name, buffer);
    await prisma.workOrder.update({
      where: { id },
      data: { pdfPath, pdfName: pdf.name },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR_MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.workOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
