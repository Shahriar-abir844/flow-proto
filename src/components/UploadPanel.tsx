"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function UploadPanel({
  workOrderId,
  workOrderNumber,
  address,
  driveFolderId,
  driveFolderUrl,
}: {
  workOrderId: string;
  workOrderNumber: string;
  address: string;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const dragCounter = useRef(0);

  const createFolder = async () => {
    setCreating(true);
    setError("");
    const res = await fetch(`/api/work-orders/${workOrderId}/folder`, { method: "POST" });
    setCreating(false);
    setConfirmOpen(false);
    if (!res.ok) {
      setError("Could not create folder. Try again.");
      return;
    }
    router.refresh();
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStagedFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    stagedFiles.forEach((f) => formData.append("files", f));

    const res = await fetch(`/api/work-orders/${workOrderId}/uploads`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (!res.ok) {
      setError("Upload failed. Try again.");
      return;
    }

    setStagedFiles([]);
    router.refresh();
  };

  if (!driveFolderId) {
    return (
      <div className="border border-neutral-200 rounded-lg bg-white p-4">
        <h2 className="text-sm font-medium mb-2">Photos / Documentation</h2>
        <p className="text-sm text-neutral-500 mb-3">
          No folder has been created for this work order yet. Create one to start uploading
          photos and documents.
        </p>

        {!confirmOpen ? (
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800"
          >
            Create Folder to Upload
          </button>
        ) : (
          <div className="border border-neutral-300 rounded-md p-3 bg-neutral-50">
            <p className="text-sm mb-3">
              Create a folder named{" "}
              <strong>
                &ldquo;{workOrderNumber} - {address}&rdquo;
              </strong>{" "}
              to submit photos and documentation for this work order?
            </p>
            <div className="flex gap-2">
              <button
                onClick={createFolder}
                disabled={creating}
                className="rounded-md bg-neutral-900 text-white text-sm px-3 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Yes, create folder"}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={creating}
                className="text-sm text-neutral-500 hover:text-neutral-900 px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Photos / Documentation</h2>
        {driveFolderUrl && !driveFolderUrl.startsWith("local://") && (
          <a
            href={driveFolderUrl}
            target="_blank"
            className="text-xs text-blue-600 hover:underline"
          >
            Open Drive folder
          </a>
        )}
      </div>

      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`block border-2 border-dashed rounded-md p-6 text-center cursor-pointer mb-3 transition-colors ${
          isDragging ? "border-neutral-900 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-sm text-neutral-500">
          {isDragging ? "Drop to add" : "Drag photos or documents here, or click to select"}
        </span>
      </label>

      {stagedFiles.length > 0 && (
        <div className="border border-neutral-200 rounded-md p-3 mb-3 space-y-2">
          <ul className="text-sm space-y-1">
            {stagedFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name}</span>
                <button
                  onClick={() => removeStagedFile(i)}
                  disabled={uploading}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
          >
            {uploading
              ? "Uploading..."
              : `Upload ${stagedFiles.length} file${stagedFiles.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
    </div>
  );
}
