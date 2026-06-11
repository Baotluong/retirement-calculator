"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteScenarioButtonProps = {
  id: number;
  name: string;
  variant?: "default" | "compact";
};

export function DeleteScenarioButton({
  id,
  name,
  variant = "default",
}: DeleteScenarioButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConfirm() {
    setError(null);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
    setError(null);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/configurations/" + id, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          typeof data.error === "string" ? data.error : "Failed to delete scenario";
        setError(message);
        return;
      }

      setConfirmOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      setError("Failed to delete scenario");
    } finally {
      setDeleting(false);
    }
  }

  const className =
    variant === "compact"
      ? "rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      : "rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60";

  return (
    <>
      <div
        className={
          variant === "compact" ? "inline-flex flex-col items-end" : "inline-flex flex-col"
        }
      >
        <button
          type="button"
          onClick={openConfirm}
          disabled={deleting}
          className={className}
        >
          {variant === "compact" ? "Delete" : "Delete scenario"}
        </button>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/40"
            aria-label="Close delete confirmation"
            onClick={closeConfirm}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-scenario-title"
            className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="delete-scenario-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Delete scenario?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">{name}</span> will be
              permanently deleted. This cannot be undone.
            </p>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={deleting}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete scenario"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
