import Link from "next/link";
import * as courseCuration from "@/services/admin/course-curation.service";

const ACCESS_BADGES: Record<string, { label: string; className: string }> = {
  public: { label: "Public", className: "bg-slate-100 text-slate-700" },
  resort: { label: "Resort", className: "bg-blue-100 text-blue-800" },
  semi_private: {
    label: "Semi-Private",
    className: "bg-amber-100 text-amber-800",
  },
  private: { label: "Private", className: "bg-red-100 text-red-800" },
  unknown: { label: "Unknown", className: "bg-slate-200 text-slate-600" },
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  active: { label: "Active", className: "bg-emerald-100 text-emerald-800" },
  hidden: { label: "Hidden", className: "bg-amber-100 text-amber-800" },
  archived: { label: "Archived", className: "bg-slate-200 text-slate-600" },
};

function formatPrice(min: string | null, max: string | null) {
  if (!min && !max) return "--";
  if (min === max && min) return `$${Number(min).toFixed(0)}`;
  if (min && max)
    return `$${Number(min).toFixed(0)}-$${Number(max).toFixed(0)}`;
  if (min) return `$${Number(min).toFixed(0)}+`;
  return `up to $${Number(max!).toFixed(0)}`;
}

export default async function CoursesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; accessType?: string; status?: string }>;
}) {
  const params = await searchParams;

  const courses = await courseCuration.listCourses({
    search: params.search,
    accessType: params.accessType,
    status: params.status,
  });

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Course Curation</h1>
        <p className="text-sm text-slate-500">
          Classify access types, edit booking rules, and update quality scores.
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Search by name..."
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 w-64"
        />
        <select
          name="accessType"
          defaultValue={params.accessType ?? ""}
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All Access Types</option>
          <option value="public">Public</option>
          <option value="resort">Resort</option>
          <option value="semi_private">Semi-Private</option>
          <option value="private">Private</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition"
        >
          Filter
        </button>
      </form>

      {/* Data table */}
      {courses.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No courses found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  City/State
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Access
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Price
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const accessBadge =
                  ACCESS_BADGES[course.accessType] ?? ACCESS_BADGES.unknown;
                const statusBadge =
                  STATUS_BADGES[course.status] ?? STATUS_BADGES.draft;
                return (
                  <tr
                    key={course.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-slate-900 font-medium hover:underline"
                      >
                        {course.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {[course.city, course.state]
                        .filter(Boolean)
                        .join(", ") || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${accessBadge.className}`}
                      >
                        {accessBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatPrice(course.priceBandMin, course.priceBandMax)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-sm text-slate-600 hover:text-slate-900 underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-200">
            {courses.length} course{courses.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
