"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
    >
      พิมพ์
    </button>
  );
}
