import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { prisma } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const pendingTasksCount = await prisma.task.count({
    where: { status: "PENDING" },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <Navigation pendingTasksCount={pendingTasksCount} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}