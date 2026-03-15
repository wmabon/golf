export default function ConfigPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Configuration</h1>
      <p className="text-sm text-slate-500 mb-8">
        Fee schedules, swap policies, and feature flags. Changes take effect
        without code deploy.
      </p>

      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Configuration management interface is under construction. Fee schedules,
        swap policy defaults, and feature flags will be editable here.
      </div>
    </div>
  );
}
