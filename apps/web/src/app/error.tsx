"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-lg font-bold text-gray-900">Unexpected error</h2>
      <p className="max-w-md text-sm text-gray-600">{error.message || "Please try again."}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[#144835] px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
