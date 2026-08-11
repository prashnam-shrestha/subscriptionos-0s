import { prisma } from "@/lib/db";
import SubscriptionsView from "./SubscriptionsView";

export default async function SubscriptionsPage() {
  const [subscriptionsRaw, customersRaw, productsRaw, profilesRaw] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        customer: true,
        product: true,
        profile: {
          include: {
            masterAccount: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.customer.findMany({
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, phone: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true, price: true, durationDays: true },
    }),
    prisma.profile.findMany({
      where: {
        isActive: true,
        masterAccount: { isActive: true },
      },
      include: {
        masterAccount: true,
        subscriptions: { where: { status: "Active" } },
      },
    }),
  ]);

  const subscriptions = subscriptionsRaw.map((s) => ({
    ...s,
    expiryDate: s.expiryDate.toISOString(),
  }));

  const eligibleProfilesMap: Record<
    string,
    { id: string; profileName: string; accountName: string; availableCapacity: number }[]
  > = {};

  profilesRaw.forEach((p) => {
    const category = p.masterAccount.category;
    const availableCapacity = p.capacity - p.subscriptions.length;
    if (availableCapacity > 0) {
      if (!eligibleProfilesMap[category]) {
        eligibleProfilesMap[category] = [];
      }
      eligibleProfilesMap[category].push({
        id: p.id,
        profileName: p.profileName,
        accountName: p.masterAccount.nickname,
        availableCapacity,
      });
    }
  });

  const profilesForForm = profilesRaw.map((p) => ({
    id: p.id,
    profileName: p.profileName,
    capacity: p.capacity,
    activeCount: p.subscriptions.length,
    masterAccount: {
      nickname: p.masterAccount.nickname,
      category: p.masterAccount.category,
    },
  }));

  return (
    <SubscriptionsView
      subscriptions={subscriptions}
      eligibleProfilesMap={eligibleProfilesMap}
      customers={customersRaw}
      products={productsRaw}
      profiles={profilesForForm}
    />
  );
}
