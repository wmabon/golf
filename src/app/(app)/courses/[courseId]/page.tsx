import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ReportForm from "./report-form";
import * as courseService from "@/services/discovery/course.service";

const ACCESS_BADGES: Record<string, { label: string; className: string }> = {
  public: { label: "Public", className: "bg-green-100 text-green-800" },
  resort: { label: "Resort", className: "bg-green-100 text-green-800" },
  semi_private: { label: "Semi-Private", className: "bg-yellow-100 text-yellow-800" },
  private: { label: "Private", className: "bg-red-100 text-red-800" },
  unknown: { label: "Unknown", className: "bg-gray-100 text-gray-800" },
};

const AMENITY_LABELS: Record<string, string> = {
  driving_range: "Driving Range",
  putting_green: "Putting Green",
  pro_shop: "Pro Shop",
  restaurant: "Restaurant",
  lodging: "Lodging",
  caddie_available: "Caddies Available",
  walking_allowed: "Walking Allowed",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { courseId } = await params;
  const course = await courseService.getCourseById(courseId);
  if (!course) notFound();

  const badge = ACCESS_BADGES[course.accessType] ?? ACCESS_BADGES.unknown;

  const formatPrice = (min: string | null, max: string | null) => {
    if (!min && !max) return "Price not available";
    if (min === max) return `$${Number(min).toFixed(0)}`;
    return `$${Number(min).toFixed(0)} - $${Number(max).toFixed(0)}`;
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link
        href="/search"
        className="text-sm text-green-700 hover:text-green-800 mb-4 inline-block"
      >
        &larr; Back to Search
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <span className={`rounded px-2.5 py-1 text-sm font-medium ${badge.className}`}>
            {badge.label}
          </span>
        </div>
        <p className="text-gray-500">
          {[course.city, course.state].filter(Boolean).join(", ")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Reasons to play */}
          {course.reasonsToPlay && (
            <section>
              <h2 className="text-lg font-semibold mb-2">What makes it worth the trip</h2>
              <p className="text-gray-700">{course.reasonsToPlay}</p>
            </section>
          )}

          {/* Booking rules */}
          <section>
            <h2 className="text-lg font-semibold mb-3">How to book</h2>
            <div className="rounded border border-gray-200 divide-y divide-gray-100">
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-sm text-gray-500">Price Range</span>
                <span className="text-sm font-medium">
                  {formatPrice(course.priceBandMin, course.priceBandMax)}
                </span>
              </div>
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-sm text-gray-500">Public access</span>
                <span className="text-sm font-medium">
                  {course.publicTimesAvailable === true
                    ? "Available"
                    : course.publicTimesAvailable === false
                    ? "Not available"
                    : "Not confirmed"}
                </span>
              </div>
              {course.bookingWindowRule && (
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-sm text-gray-500">Book ahead</span>
                  <span className="text-sm font-medium">
                    {course.bookingWindowRule}
                    {course.bookingWindowDays && ` (${course.bookingWindowDays} days)`}
                  </span>
                </div>
              )}
              {course.cancellationRule && (
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-sm text-gray-500">Cancellation</span>
                  <span className="text-sm font-medium">
                    {course.cancellationRule}
                    {course.cancellationDeadlineHours &&
                      ` (${course.cancellationDeadlineHours}h deadline)`}
                  </span>
                </div>
              )}
              {course.maxPlayers && (
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-sm text-gray-500">Max per tee time</span>
                  <span className="text-sm font-medium">{course.maxPlayers} players</span>
                </div>
              )}
              {course.ruleSource && (
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-sm text-gray-500">Source</span>
                  <span className="text-xs text-gray-400">{course.ruleSource}</span>
                </div>
              )}
            </div>
          </section>

          {/* Amenities */}
          {course.amenities && Object.keys(course.amenities).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(course.amenities).map(([key, available]) =>
                  available ? (
                    <span
                      key={key}
                      className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {AMENITY_LABELS[key] ?? key}
                    </span>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* Contact */}
          {(course.websiteUrl || course.phone) && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Contact</h2>
              <div className="space-y-1 text-sm">
                {course.websiteUrl && (
                  <p>
                    <a
                      href={course.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:underline"
                    >
                      {course.websiteUrl}
                    </a>
                  </p>
                )}
                {course.phone && <p className="text-gray-700">{course.phone}</p>}
              </div>
            </section>
          )}

          {/* Report issue */}
          <section>
            <h2 className="text-lg font-semibold mb-3">See something off?</h2>
            <ReportForm courseId={course.id} />
          </section>
        </div>

        {/* Sidebar - Quality scores */}
        <div className="space-y-4">
          {/* Composite quality (editorial + external) */}
          <div className="rounded border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Quality Score
            </h3>
            {course.editorialScore || course.externalRankScore || course.valueScore ? (
              <div className="space-y-3">
                {course.editorialScore && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-600">Editorial</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {Number(course.editorialScore).toFixed(1)}
                    </span>
                  </div>
                )}
                {course.externalRankScore && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-600">External Rank</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {Number(course.externalRankScore).toFixed(1)}
                    </span>
                  </div>
                )}
                {course.valueScore && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-600">Value</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {Number(course.valueScore).toFixed(1)}
                    </span>
                  </div>
                )}
                {course.valueLabel && (
                  <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {course.valueLabel}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">We&apos;re still scouting this one.</p>
            )}
          </div>

          {/* Community score - always separate per FR-17 */}
          <div className="rounded border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Community Rating
            </h3>
            {course.communityAverageScore ? (
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {Number(course.communityAverageScore).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  / 5.0
                </span>
                {course.reviewCount != null && course.reviewCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Based on {course.reviewCount} review{course.reviewCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No reviews yet. Play it and be the first.</p>
            )}
          </div>

          {/* Access confidence */}
          <div className="rounded border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Access Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Confidence</span>
                <span className="text-gray-700 capitalize">{course.accessConfidence}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
