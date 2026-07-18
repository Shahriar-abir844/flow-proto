import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { savePdf } from "@/lib/storage";
import { reserveNextWorkOrderNumber } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR_MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const manualWorkOrderNumber = (form.get("workOrderNumber") as string | null)?.trim();
  const title = form.get("title") as string;
  const address = form.get("address") as string;
  const instructions = form.get("instructions") as string;
  const vendorId = (form.get("vendorId") as string) || null;
  const lineItemsRaw = form.get("lineItems") as string;
  const pdf = form.get("pdf") as File | null;

  if (!title || !address || !instructions) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let lineItems: { description: string; price: number; instructions?: string }[] = [];
  try {
    lineItems = JSON.parse(lineItemsRaw || "[]");
  } catch {
    return NextResponse.json({ error: "Invalid line items" }, { status: 400 });
  }

  const workOrderNumber = manualWorkOrderNumber || (await reserveNextWorkOrderNumber());

  let workOrder;
  try {
    workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber,
        title,
        address,
        instructions,
        vendorId: vendorId || undefined,
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: `Work order number "${workOrderNumber}" is already in use.` },
        { status: 400 }
      );
    }
    throw err;
  }

  if (pdf && pdf.size > 0) {
    const buffer = Buffer.from(await pdf.arrayBuffer());
    const pdfPath = await savePdf(workOrder.id, pdf.name, buffer);
    await prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { pdfPath, pdfName: pdf.name },
    });
  }

  return NextResponse.json({ id: workOrder.id });
}
