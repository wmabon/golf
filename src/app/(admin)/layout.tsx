import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import * as userService from "@/services/identity/user.service";
import { AdminNav } from "@/components/ui/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await userService.getUserById(session.user.id);

  if (
    !user ||
    (user.systemRole !== "admin" && user.systemRole !== "concierge_ops")
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav userName={session.user.name} />
      {/* Main content area — offset by sidebar width on desktop, top bar on mobile */}
      <main className="md:ml-64 mt-12 md:mt-0 p-6">
        {children}
      </main>
    </div>
  );
}
