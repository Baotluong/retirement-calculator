"use client";

type ExportComparePdfButtonProps = {
  ids: number[];
};

export function ExportComparePdfButton({ ids }: ExportComparePdfButtonProps) {
  function handleExport() {
    window.open(
      "/compare/print?ids=" + ids.join(","),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Export PDF
    </button>
  );
}
