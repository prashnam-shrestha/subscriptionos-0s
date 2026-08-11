export const dynamic = "force-dynamic";
export const revalidate = 0;
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import AccountDetailHeader from "./AccountDetailHeader";
import ProfileForm from "./ProfileForm";
import ProfileRowActions from "./ProfileRowActions";
import OccupancyDetailModal from "./OccupancyDetailModal";
import AutoGenerateProfilesModal from "./AutoGenerateProfilesModal";
import { markProfileNotifiedAction } from "../actions";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [account, products] = await Promise.all([
    prisma.masterAccount.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            subscriptions: {
              include: {
                customer: { select: { id: true, fullName: true, phone: true } },
                product: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.product.findMany({
      select: { category: true },
      where: { isActive: true },
    }),
  ]);

  if (!account) notFound();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTicketCount = account.tickets.filter(
    (t) => new Date(t.createdAt) >= sevenDaysAgo
  ).length;

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort();

  return (
    <div className="space-y-6">
      <AccountDetailHeader
        account={{
          id: account.id,
          nickname: account.nickname,
          category: account.category,
          loginEmail: account.loginEmail,
          isActive: account.isActive,
          recentTicketCount,
          healthStatus: recentTicketCount >= 3 ? "UNSTABLE" : "HEALTHY",
          tickets: account.tickets.map((t) => ({
            id: t.id,
            issue: t.issue,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
          })),
        }}
        categories={categories}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Profile Slots ({account.profiles.length})
            </h2>
            <AutoGenerateProfilesModal
              masterAccountId={account.id}
              category={account.category}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {account.profiles.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No profile slots added yet. Use the form or click Auto Generate.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Profile Name</th>
                    <th className="px-4 py-3">PIN</th>
                    <th className="px-4 py-3">Occupancy</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {account.profiles.map((profile) => {
                    const activeSubs = profile.subscriptions.filter(
                      (s) => s.status === "Active"
                    );
                    const activeCount = activeSubs.length;

                    const pinDisplay = profile.encryptedPin
                      ? decrypt(profile.encryptedPin)
                      : "—";

                    return (
                      <tr
                        key={profile.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {profile.profileName}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {pinDisplay}
                        </td>
                        <td className="px-4 py-3">
                          <OccupancyDetailModal
                            profileName={profile.profileName}
                            capacity={profile.capacity}
                            subscriptions={profile.subscriptions}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={profile.isActive ? "success" : "secondary"}>
                            {profile.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <ProfileRowActions
                            profile={{
                              id: profile.id,
                              masterAccountId: account.id,
                              profileName: profile.profileName,
                              capacity: profile.capacity,
                              isActive: profile.isActive,
                              activeCount,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Add Profile Slot
          </h2>
          <ProfileForm masterAccountId={account.id} />
        </div>
      </div>
    </div>
  );
}
