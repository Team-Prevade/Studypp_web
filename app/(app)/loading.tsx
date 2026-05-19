export default function AppLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
