"use server";

import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const [allSubscriptions, profiles, customerCount, masterAccountCount, renewalLogs] =
    await Promise.all([
      prisma.subscription.findMany({
        include: {
          customer: true,
          product: true,
          profile: {
            include: { masterAccount: true },
          },
        },
      }),
      prisma.profile.findMany({
        where: { isActive: true, masterAccount: { isActive: true } },
        include: {
          masterAccount: true,
          subscriptions: { where: { status: "Active" } },
        },
      }),
      prisma.customer.count(),
      prisma.masterAccount.count(),
      prisma.renewalLog.findMany({
        orderBy: { renewedAt: "desc" },
        take: 20,
        include: {
          subscription: {
            include: { customer: true, product: true },
          },
        },
      }),
    ]);

  const activeSubscriptions = allSubscriptions.filter(
    (s) => s.status === "Active" && new Date(s.expiryDate) >= now
  );

  const expiringSoonSubscriptions = allSubscriptions
    .filter((s) => {
      const exp = new Date(s.expiryDate);
      return s.status === "Active" && exp >= now && exp <= sevenDaysFromNow;
    })
    .map((s) => ({
      id: s.id,
      customerId: s.customerId,
      customerName: s.customer.fullName,
      customerPhone: s.customer.phone,
      productName: s.product.name,
      masterAccountNickname: s.profile.masterAccount.nickname,
      profileName: s.profile.profileName,
      expiryDate: s.expiryDate.toISOString(),
    }));

  const totalRevenue = allSubscriptions.reduce((sum, s) => sum + s.amountPaid, 0);

  const mrr = activeSubscriptions.reduce((acc, sub) => {
    const durationDays = sub.product.durationDays || 30;
    return acc + (sub.amountPaid / durationDays) * 30;
  }, 0);

  const totalSlots = profiles.reduce((sum, p) => sum + p.capacity, 0);
  const totalOccupiedSlots = profiles.reduce(
    (sum, p) => sum + p.subscriptions.length,
    0
  );
  const utilizationPct =
    totalSlots > 0 ? Math.round((totalOccupiedSlots / totalSlots) * 100) : 0;

  // Sales volume trend — last 90 days in weekly buckets
  const salesTrend: { label: string; revenue: number; count: number }[] = [];
  const trendStart = new Date(now);
  trendStart.setDate(trendStart.getDate() - 89);
  trendStart.setHours(0, 0, 0, 0);

  for (let w = 0; w < 13; w++) {
    const bucketStart = new Date(trendStart);
    bucketStart.setDate(trendStart.getDate() + w * 7);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + 6);
    bucketEnd.setHours(23, 59, 59, 999);

    if (bucketStart > now) break;

    const effectiveEnd = bucketEnd > now ? now : bucketEnd;

    const weekSubs = allSubscriptions.filter((s) => {
      const created = new Date(s.createdAt);
      return created >= bucketStart && created <= effectiveEnd;
    });

    const revenue = weekSubs.reduce((sum, s) => sum + s.amountPaid, 0);
    const label = bucketStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    salesTrend.push({
      label,
      revenue: Math.round(revenue),
      count: weekSubs.length,
    });
  }

  // Category revenue breakdown by product name (consumer-friendly labels)
  const categoryRevenue: Record<string, number> = {};
  for (const sub of activeSubscriptions) {
    const label = sub.product.name;
    categoryRevenue[label] = (categoryRevenue[label] || 0) + sub.amountPaid;
  }

  const categoryChartData = Object.entries(categoryRevenue)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const CHART_COLORS = [
    "#0f172a",
    "#334155",
    "#475569",
    "#64748b",
    "#94a3b8",
    "#cbd5e1",
    "#f59e0b",
    "#10b981",
  ];

  return {
    metrics: {
      totalRevenue,
      mrr: Math.round(mrr),
      activeSubscriptions: activeSubscriptions.length,
      customerCount,
      masterAccountCount,
      expiringSoonCount: expiringSoonSubscriptions.length,
      utilizationPct,
      totalOccupiedSlots,
      totalSlots,
    },
    salesTrend,
    categoryChartData,
    chartColors: CHART_COLORS,
    expiringSoonSubscriptions,
    recentRenewals: renewalLogs.map((r) => ({
      id: r.id,
      customerName: r.subscription.customer.fullName,
      productName: r.subscription.product.name,
      amountPaid: r.amountPaid,
      renewedAt: r.renewedAt.toISOString(),
    })),
  };
}
