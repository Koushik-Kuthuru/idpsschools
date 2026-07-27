export default function SchoolsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-[#144835]/20" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        <p className="text-xs font-medium text-gray-500">Loading portal…</p>
      </div>
    </div>
  );
}
