import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="text-xl font-bold tracking-wide mb-8 text-white">
            SubscriptionOS
          </div>
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/customers"
              className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Customers
            </Link>
            <Link
              href="/accounts"
              className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Master Accounts
            </Link>
            <Link
              href="/products"
              className="block rounded px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Products
            </Link>
          </nav>
        </div>
        <div className="text-xs text-slate-400 border-t border-slate-800 pt-4">
          Logged in as: {session.user.email}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}