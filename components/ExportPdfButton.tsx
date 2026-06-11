import Link from "next/link";

type ExportPdfButtonProps = {
  configurationId: number;
};

export function ExportPdfButton({ configurationId }: ExportPdfButtonProps) {
  return (
    <Link
      href={"/configurations/" + configurationId + "/print?autoprint=1"}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Export PDF
    </Link>
  );
}
