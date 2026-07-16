"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-neutral-900 text-white text-sm px-4 py-2 hover:bg-neutral-800 print:hidden"
    >
      Print
    </button>
  );
}
