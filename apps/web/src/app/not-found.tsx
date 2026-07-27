import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="text-sm text-gray-600">The page you requested does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-[#144835] px-4 py-2 text-sm font-semibold text-white"
      >
        Back to home
      </Link>
    </main>
  );
}
