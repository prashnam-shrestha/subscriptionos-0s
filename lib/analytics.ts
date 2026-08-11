"use server";

import { prisma } from "@/lib/db";

export async function getRevenueAnalytics() {
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const [
    activeSubscriptions,
    expiringSoonCount,
    totalCustomers,
    allProfiles,
    productBreakdown,
    salesHistory,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "Active" },
      include: { product: true },
    }),
    prisma.subscription.count({
      where: {
        status: "Active",
        expiryDate: { gte: now, lte: next7Days },
      },
    }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.profile.findMany({
      where: { isActive: true },
      include: {
        subscriptions: { where: { status: "Active" } },
      },
    }),
    prisma.product.findMany({
      include: {
        subscriptions: { where: { status: "Active" } },
      },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        product: true,
        profile: {
          include: {
            masterAccount: true,
          },
        },
      },
      take: 50,
    }),
  ]);

  const grossActiveRevenue = activeSubscriptions.reduce(
    (acc, sub) => acc + sub.amountPaid,
    0
  );

  const mrr = activeSubscriptions.reduce((acc, sub) => {
    const durationDays = sub.product.durationDays || 30;
    const monthlyEquivalent = (sub.amountPaid / durationDays) * 30;
    return acc + monthlyEquivalent;
  }, 0);

  const totalSeatsProvisioned = allProfiles.reduce((acc, p) => acc + p.capacity, 0);
  const totalSeatsOccupied = allProfiles.reduce(
    (acc, p) => acc + p.subscriptions.length,
    0
  );
  const seatUtilizationRate =
    totalSeatsProvisioned > 0
      ? (totalSeatsOccupied / totalSeatsProvisioned) * 100
      : 0;

  const categoryStats: Record<string, { count: number; revenue: number }> = {};
  for (const prod of productBreakdown) {
    const cat = prod.category;
    if (!categoryStats[cat]) {
      categoryStats[cat] = { count: 0, revenue: 0 };
    }
    const activeCount = prod.subscriptions.length;
    const rev = prod.subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);
    categoryStats[cat].count += activeCount;
    categoryStats[cat].revenue += rev;
  }

  const formattedSales = salesHistory.map((s) => ({
    id: s.id,
    customerName: s.customer.fullName,
    customerId: s.customer.id,
    customerPhone: s.customer.phone,
    productName: s.product.name,
    productCategory: s.product.category,
    profileName: s.profile.profileName,
    masterAccountNickname: s.profile.masterAccount.nickname,
    amountPaid: s.amountPaid,
    startDate: s.startDate.toISOString(),
    expiryDate: s.expiryDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
    status: s.status,
  }));

  return {
    mrr,
    grossActiveRevenue,
    activeSubscriptionsCount: activeSubscriptions.length,
    expiringSoonCount,
    totalCustomers,
    totalSeatsProvisioned,
    totalSeatsOccupied,
    seatUtilizationRate,
    categoryStats,
    salesHistory: formattedSales,
  };
}
