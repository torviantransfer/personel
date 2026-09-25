export default function Loading() {
  return (
    <div className="safe-top animate-pulse px-5" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-12" />
      <div className="h-4 w-28 rounded-md bg-slate-200/80" />
      <div className="mt-2 h-8 w-48 rounded-lg bg-slate-200/80" />
      <div className="mt-6 space-y-3">
        <div className="h-32 rounded-2xl bg-white" />
        <div className="h-20 rounded-2xl bg-white" />
        <div className="h-44 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
