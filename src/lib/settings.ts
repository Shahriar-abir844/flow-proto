import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export async function setDriveFolderLink(link: string | null) {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: { driveFolderLink: link },
    create: { id: SETTINGS_ID, driveFolderLink: link },
  });
}

// Each field is only overwritten when a non-empty value is passed, so the
// form can submit "leave blank to keep existing" for secrets it never
// re-displays.
export async function setGoogleCredentials(data: {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}) {
  const update: Record<string, string> = {};
  if (data.clientId) update.googleClientId = data.clientId;
  if (data.clientSecret) update.googleClientSecret = data.clientSecret;
  if (data.refreshToken) update.googleRefreshToken = data.refreshToken;

  if (Object.keys(update).length === 0) return getSettings();

  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update,
    create: { id: SETTINGS_ID, ...update },
  });
}

export async function clearGoogleCredentials() {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: { googleClientId: null, googleClientSecret: null, googleRefreshToken: null },
    create: { id: SETTINGS_ID },
  });
}

export async function setSiteInfo(data: { companyName: string | null; supportContact: string | null }) {
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: { companyName: data.companyName, supportContact: data.supportContact },
    create: { id: SETTINGS_ID, ...data },
  });
}

// Atomically reserves the next work order number, e.g. "WO-0007".
export async function reserveNextWorkOrderNumber(): Promise<string> {
  await getSettings();
  const settings = await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: { nextWorkOrderNumber: { increment: 1 } },
  });
  const number = settings.nextWorkOrderNumber - 1;
  return `WO-${String(number).padStart(4, "0")}`;
}

// Accepts a full Drive folder URL (https://drive.google.com/drive/folders/<id>...)
// or a bare folder ID, and returns just the ID.
export function extractDriveFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Bare folder ID (no slashes/spaces)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}
