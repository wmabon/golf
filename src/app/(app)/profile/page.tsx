import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Name
          </label>
          <p className="text-lg">{session.user?.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Email
          </label>
          <p className="text-lg">{session.user?.email}</p>
        </div>

        <p className="text-sm text-gray-400 pt-4">
          Profile editing and membership management coming in the next build.
        </p>
      </div>
    </main>
  );
}
