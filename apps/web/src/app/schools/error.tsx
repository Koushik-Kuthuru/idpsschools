"use client";

export default function SchoolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f8f7] px-6 text-center">
      <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-600">
        {error.message || "This school portal page failed to load. Please try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[#144835] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3628]"
      >
        Try again
      </button>
    </div>
  );
}
