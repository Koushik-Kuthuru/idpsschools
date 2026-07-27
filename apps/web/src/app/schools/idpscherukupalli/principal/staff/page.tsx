function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <h1 className="text-xl font-extrabold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">This section is coming soon on web.</p>
    </div>
  );
}

export default function PrincipalStaffPage() {
  return <PlaceholderPage title="Staff Management" />;
}
