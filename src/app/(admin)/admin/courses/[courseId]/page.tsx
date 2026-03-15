import Link from "next/link";
import { notFound } from "next/navigation";
import * as courseService from "@/services/discovery/course.service";
import * as courseCuration from "@/services/admin/course-curation.service";
import { CourseEditor } from "./course-editor";

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

const REPORT_STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-red-100 text-red-800" },
  reviewed: { label: "Reviewed", className: "bg-amber-100 text-amber-800" },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-100 text-emerald-800",
  },
  dismissed: { label: "Dismissed", className: "bg-slate-200 text-slate-600" },
};

function formatDate(date: Date | string | null) {
  if (!date) return "--";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CourseDetailAdminPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course, rules, reports] = await Promise.all([
    courseService.getCourseById(courseId),
    courseCuration.getRulesForCourse(courseId),
    courseCuration.getReportsForCourse(courseId),
  ]);

  if (!course) notFound();

  const accessBadge =
    ACCESS_BADGES[course.accessType] ?? ACCESS_BADGES.unknown;

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/admin/courses" className="hover:text-slate-700">
          Courses
        </Link>
        <span>/</span>
        <span className="text-slate-700">{course.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {course.name}
            </h1>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${accessBadge.className}`}
            >
              {accessBadge.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {[course.city, course.state].filter(Boolean).join(", ") || "No location"}
            {course.accessConfidence && (
              <span className="ml-2 text-slate-400">
                &middot; confidence: {course.accessConfidence}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — forms */}
        <div className="lg:col-span-2 space-y-6">
          <CourseEditor
            courseId={courseId}
            currentAccess={{
              accessType: course.accessType,
              accessConfidence: course.accessConfidence,
            }}
            currentRules={
              rules
                ? {
                    bookingWindowDays: rules.bookingWindowDays,
                    cancellationDeadlineHours: rules.cancellationDeadlineHours,
                    maxPlayers: rules.maxPlayers,
                    bookingChannel: rules.bookingChannel,
                    rulesConfirmed: rules.rulesConfirmed,
                    publicTimesAvailable: rules.publicTimesAvailable,
                    bookingWindowRule: rules.bookingWindowRule,
                    cancellationRule: rules.cancellationRule,
                  }
                : null
            }
          />
        </div>

        {/* Right column — read-only info */}
        <div className="space-y-6">
          {/* Quality Scores */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3">
              Quality Scores
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Editorial</span>
                <span className="text-slate-900 font-medium">
                  {course.editorialScore
                    ? `${Number(course.editorialScore).toFixed(1)}/5`
                    : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">External Rank</span>
                <span className="text-slate-900 font-medium">
                  {course.externalRankScore
                    ? `${Number(course.externalRankScore).toFixed(1)}/5`
                    : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Value</span>
                <span className="text-slate-900 font-medium">
                  {course.valueScore
                    ? `${Number(course.valueScore).toFixed(1)}/5`
                    : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Community Avg</span>
                <span className="text-slate-900 font-medium">
                  {course.communityAverageScore
                    ? `${Number(course.communityAverageScore).toFixed(1)}/5 (${course.reviewCount ?? 0})`
                    : "--"}
                </span>
              </div>
              {course.valueLabel && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Value Label</span>
                  <span className="text-slate-900 font-medium">
                    {course.valueLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Course Details */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3">
              Course Details
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="text-slate-900">{course.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price</span>
                <span className="text-slate-900">
                  {course.priceBandMin && course.priceBandMax
                    ? `$${Number(course.priceBandMin).toFixed(0)}-$${Number(course.priceBandMax).toFixed(0)}`
                    : "--"}
                </span>
              </div>
              {course.websiteUrl && (
                <div>
                  <span className="text-slate-500">Website</span>
                  <p className="text-slate-900 text-xs break-all mt-0.5">
                    {course.websiteUrl}
                  </p>
                </div>
              )}
              {course.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="text-slate-900">{course.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reports */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3">
              Reports ({reports.length})
            </h2>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-500">
                No reports for this course.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => {
                  const badge =
                    REPORT_STATUS_BADGES[report.status] ??
                    REPORT_STATUS_BADGES.open;
                  return (
                    <div
                      key={report.id}
                      className="border border-slate-200 rounded p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">
                          {report.reportType.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        {report.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
