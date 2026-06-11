"use client";

type PrintToolbarProps = {
  backHref: string;
  backLabel?: string;
};

export function PrintToolbar({ backHref, backLabel = "Back to scenario" }: PrintToolbarProps) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-600">
        Use your browser&apos;s print dialog and choose &quot;Save as PDF&quot;.
      </p>
      <div className="flex gap-3">
        <a
          href={backHref}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {backLabel}
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

