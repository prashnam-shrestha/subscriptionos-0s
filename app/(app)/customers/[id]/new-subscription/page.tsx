import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewSubscriptionForm from "./NewSubscriptionForm";

export default async function NewSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    notFound();
  }

  const [activeProducts, rawProfiles] = await Promise.all([
  prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  }),
  prisma.profile.findMany({
    where: { isActive: true },
    include: {
      masterAccount: {
        select: { nickname: true, category: true },
      },
      subscriptions: {
        where: { status: "Active" },
        select: { id: true },
      },
    },
    orderBy: { profileName: "asc" },
  })
]);

  const profiles = rawProfiles.map((p) => ({
    id: p.id,
    profileName: p.profileName,
    capacity: p.capacity,
    activeCount: p.subscriptions.length,
    masterAccount: p.masterAccount,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/customers/${customer.id}`}
          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Cancel & Back to Customer Profile
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
          New Subscription for {customer.fullName}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Phone: {customer.phone}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <NewSubscriptionForm
          customerId={customer.id}
          products={activeProducts}
          profiles={profiles}
        />
      </div>
    </div>
  );
}
