import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CustomerProfileView from "./CustomerProfileView";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      subscriptions: {
        include: {
          product: true,
          profile: {
            include: {
              masterAccount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const [renewalLogs, allActiveProfiles] = await Promise.all([
  prisma.renewalLog.findMany({
    where: {
      subscription: { customerId: id },
    },
    orderBy: { renewedAt: "desc" },
    include: {
      subscription: {
        include: { product: true },
      },
    },
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
  })
]);

  const eligibleProfilesByCategory: Record<
    string,
    { id: string; profileName: string; accountName: string; availableCapacity: number }[]
  > = {};

  for (const p of allActiveProfiles) {
    const category = p.masterAccount.category;
    const available = p.capacity - p.subscriptions.length;
    if (available <= 0) continue;
    if (!eligibleProfilesByCategory[category]) {
      eligibleProfilesByCategory[category] = [];
    }
    eligibleProfilesByCategory[category].push({
      id: p.id,
      profileName: p.profileName,
      accountName: p.masterAccount.nickname,
      availableCapacity: available,
    });
  }

  const serializedCustomer = {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    notes: customer.notes,
    isActive: customer.isActive,
    createdAt: customer.createdAt.toISOString(),
    subscriptions: customer.subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status,
      expiryDate: sub.expiryDate.toISOString(),
      amountPaid: sub.amountPaid,
      startDate: sub.startDate.toISOString(),
      createdAt: sub.createdAt.toISOString(),
      profileId: sub.profileId,
      product: {
        name: sub.product.name,
        category: sub.product.category,
        price: sub.product.price,
        durationDays: sub.product.durationDays,
      },
      profile: {
        profileName: sub.profile.profileName,
        masterAccount: {
          nickname: sub.profile.masterAccount.nickname,
          category: sub.profile.masterAccount.category,
        },
      },
    })),
    renewalLogs: renewalLogs.map((log) => ({
      id: log.id,
      amountPaid: log.amountPaid,
      renewedAt: log.renewedAt.toISOString(),
      previousExpiryDate: log.previousExpiryDate.toISOString(),
      newExpiryDate: log.newExpiryDate.toISOString(),
      subscription: {
        product: { name: log.subscription.product.name },
      },
    })),
  };

  return (
    <CustomerProfileView
      customer={serializedCustomer}
      eligibleProfilesByCategory={eligibleProfilesByCategory}
    />
  );
}
