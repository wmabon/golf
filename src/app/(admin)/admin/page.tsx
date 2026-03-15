import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        Operations Console
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Internal administration and concierge operations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/booking-ops"
          className="block rounded-lg border border-slate-200 bg-white p-6 hover:border-slate-400 transition"
        >
          <h2 className="font-bold text-slate-900 mb-1">Booking Ops</h2>
          <p className="text-sm text-slate-500">
            View pending booking requests, assign concierges, attach
            confirmations, and manage escalations.
          </p>
        </Link>

        <Link
          href="/admin/courses"
          className="block rounded-lg border border-slate-200 bg-white p-6 hover:border-slate-400 transition"
        >
          <h2 className="font-bold text-slate-900 mb-1">Course Curation</h2>
          <p className="text-sm text-slate-500">
            Classify access types, edit booking rules, update quality scores,
            and resolve user reports.
          </p>
        </Link>

        <Link
          href="/admin/config"
          className="block rounded-lg border border-slate-200 bg-white p-6 hover:border-slate-400 transition"
        >
          <h2 className="font-bold text-slate-900 mb-1">Configuration</h2>
          <p className="text-sm text-slate-500">
            Fee schedules, swap policies, and feature flags. Changes take effect
            without code deploy.
          </p>
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-400">
          <h2 className="font-bold mb-1">Content Moderation</h2>
          <p className="text-sm">
            Photo removal, microsite management, and support tickets. Coming
            soon.
          </p>
        </div>
      </div>
    </div>
  );
}
