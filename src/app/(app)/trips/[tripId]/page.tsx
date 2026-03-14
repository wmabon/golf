import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import * as tripService from "@/services/trip/trip.service";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { tripId } = await params;
  const trip = await tripService.getTrip(tripId);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-green-700">
            Trips
          </Link>
          <span>/</span>
          <span>{trip?.name || "Trip"}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{trip?.name || "Trip Details"}</h1>
          {trip && (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-800 uppercase">
              {trip.status}
            </span>
          )}
        </div>
        {trip && (
          <p className="text-gray-500 text-sm mt-1">
            {trip.dateStart} to {trip.dateEnd} &middot; {trip.golferCount} golfers &middot;{" "}
            {trip.anchorValue}
          </p>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link
          href={`/trips/${tripId}/vote`}
          className="rounded-lg border border-gray-200 p-4 text-center hover:border-green-600 hover:bg-green-50 transition"
        >
          <div className="font-bold text-sm">Vote Board</div>
          <div className="text-xs text-gray-500">Who&apos;s in?</div>
        </Link>
        <Link
          href={`/search`}
          className="rounded-lg border border-gray-200 p-4 text-center hover:border-green-600 hover:bg-green-50 transition"
        >
          <div className="font-bold text-sm">Find Courses</div>
          <div className="text-xs text-gray-500">Find the goods</div>
        </Link>
        <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-400">
          <div className="font-bold text-sm">Itinerary</div>
          <div className="text-xs">Coming soon</div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 text-center text-gray-400">
          <div className="font-bold text-sm">Photos</div>
          <div className="text-xs">Coming soon</div>
        </div>
      </div>

      {/* Activity feed placeholder */}
      <div>
        <h2 className="font-bold text-lg mb-4">What&apos;s happening</h2>
        <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
          <p className="text-green-900 font-medium mb-1">
            Nothing yet. The trip&apos;s waiting on you.
          </p>
          <p className="text-green-700 text-sm">
            Invite your crew, find some courses, and get the votes rolling.
          </p>
        </div>
      </div>
    </main>
  );
}
