import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENDOR_MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, username, password } = await req.json();
  if (!name || !username || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "A user with this username already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const vendor = await prisma.user.create({
    data: { name, username, passwordHash, role: "VENDOR" },
  });

  return NextResponse.json({ id: vendor.id });
}
