import { auth } from "@/lib/auth";
import { Nav } from "@/components/ui/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <Nav userName={session?.user?.name} />
      {children}
    </>
  );
}
