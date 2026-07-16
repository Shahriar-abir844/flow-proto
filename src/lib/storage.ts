import { google } from "googleapis";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { getSettings, extractDriveFolderId } from "@/lib/settings";

export type FolderRef = { folderId: string; folderUrl: string };
export type UploadedFile = { path: string; driveFileId: string | null };

const uploadsRoot = path.join(process.cwd(), process.env.UPLOADS_DIR ?? "uploads");

// Credentials can come from the Settings page (DB) or from .env as a
// fallback for deployments that prefer platform-managed secrets. DB wins.
async function getGoogleCredentials() {
  const settings = await getSettings();
  return {
    clientId: settings.googleClientId || process.env.GOOGLE_CLIENT_ID || null,
    clientSecret: settings.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || null,
    refreshToken: settings.googleRefreshToken || process.env.GOOGLE_REFRESH_TOKEN || null,
  };
}

async function getParentFolderId(): Promise<string | null> {
  const settings = await getSettings();
  if (!settings.driveFolderLink) return null;
  return extractDriveFolderId(settings.driveFolderLink);
}

async function driveConfigured() {
  const { clientId, clientSecret, refreshToken } = await getGoogleCredentials();
  if (!clientId || !clientSecret || !refreshToken) return false;
  return Boolean(await getParentFolderId());
}

async function driveClient() {
  const { clientId, clientSecret, refreshToken } = await getGoogleCredentials();
  const oauth2Client = new google.auth.OAuth2(clientId ?? undefined, clientSecret ?? undefined);
  oauth2Client.setCredentials({ refresh_token: refreshToken ?? undefined });
  return google.drive({ version: "v3", auth: oauth2Client });
}

function sanitizeFolderName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

async function ensureFolderLocal(workOrderId: string, address: string): Promise<FolderRef> {
  const folderName = `${sanitizeFolderName(address)}__${workOrderId}`;
  const dir = path.join(uploadsRoot, folderName);
  await fs.mkdir(dir, { recursive: true });
  return { folderId: folderName, folderUrl: `local://${folderName}` };
}

async function ensureFolderDrive(address: string, parentFolderId: string): Promise<FolderRef> {
  const drive = await driveClient();
  const folderName = sanitizeFolderName(address);

  const res = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id, webViewLink",
  });

  return {
    folderId: res.data.id as string,
    folderUrl: res.data.webViewLink ?? `https://drive.google.com/drive/folders/${res.data.id}`,
  };
}

export async function ensureWorkOrderFolder(
  workOrderId: string,
  address: string
): Promise<FolderRef> {
  const parentFolderId = await getParentFolderId();
  if ((await driveConfigured()) && parentFolderId) return ensureFolderDrive(address, parentFolderId);
  return ensureFolderLocal(workOrderId, address);
}

async function uploadFileLocal(folderId: string, fileName: string, buffer: Buffer): Promise<UploadedFile> {
  const dir = path.join(uploadsRoot, folderId);
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}-${sanitizeFolderName(fileName)}`;
  await fs.writeFile(path.join(dir, safeName), buffer);
  return { path: path.posix.join(folderId, safeName), driveFileId: null };
}

async function uploadFileDrive(folderId: string, fileName: string, buffer: Buffer, mimeType: string): Promise<UploadedFile> {
  const drive = await driveClient();
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: bufferToStream(buffer) },
    fields: "id, webViewLink",
  });
  return { path: res.data.webViewLink ?? `https://drive.google.com/file/d/${res.data.id}`, driveFileId: res.data.id ?? null };
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer);
}

export async function uploadFileToFolder(
  folderId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<UploadedFile> {
  if (await driveConfigured()) return uploadFileDrive(folderId, fileName, buffer, mimeType);
  return uploadFileLocal(folderId, fileName, buffer);
}

export async function savePdf(workOrderId: string, fileName: string, buffer: Buffer): Promise<string> {
  const dir = path.join(uploadsRoot, "_pdfs", workOrderId);
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${crypto.randomUUID()}-${sanitizeFolderName(fileName)}`;
  await fs.writeFile(path.join(dir, safeName), buffer);
  return path.posix.join("_pdfs", workOrderId, safeName);
}

export async function readLocalFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(path.join(uploadsRoot, relativePath));
}

export async function getDriveStatus() {
  const [{ clientId, clientSecret, refreshToken }, parentFolderId] = await Promise.all([
    getGoogleCredentials(),
    getParentFolderId(),
  ]);
  const oauthConfigured = Boolean(clientId && clientSecret && refreshToken);
  return {
    clientIdSet: Boolean(clientId),
    clientSecretSet: Boolean(clientSecret),
    refreshTokenSet: Boolean(refreshToken),
    oauthConfigured,
    folderConfigured: Boolean(parentFolderId),
    active: oauthConfigured && Boolean(parentFolderId),
  };
}
