import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setDriveFolderLink, extractDriveFolderId } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUTHORITY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { driveFolderLink } = await req.json();
  const link = (driveFolderLink ?? "").trim();

  if (link && !extractDriveFolderId(link)) {
    return NextResponse.json(
      { error: "Couldn't find a folder ID in that link. Paste the folder's URL or ID." },
      { status: 400 }
    );
  }

  await setDriveFolderLink(link || null);
  return NextResponse.json({ ok: true });
}
