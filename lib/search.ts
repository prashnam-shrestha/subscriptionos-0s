"use server";

import { prisma } from "@/lib/db";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  type: "Customer" | "Product" | "Master Account" | "Subscription";
  url: string;
};

export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  const [customers, products, accounts, subscriptions] = await Promise.all([
    prisma.customer.findMany({
      where: {
        AND: tokens.map((token) => ({
          OR: [
            { fullName: { contains: token, mode: "insensitive" } },
            { phone: { contains: token, mode: "insensitive" } },
            { notes: { contains: token, mode: "insensitive" } },
          ],
        })),
      },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        AND: tokens.map((token) => ({
          OR: [
            { name: { contains: token, mode: "insensitive" } },
            { category: { contains: token, mode: "insensitive" } },
          ],
        })),
      },
      take: 5,
    }),
    prisma.masterAccount.findMany({
      where: {
        AND: tokens.map((token) => ({
          OR: [
            { nickname: { contains: token, mode: "insensitive" } },
            { loginEmail: { contains: token, mode: "insensitive" } },
            { category: { contains: token, mode: "insensitive" } },
          ],
        })),
      },
      take: 5,
    }),
    prisma.subscription.findMany({
      where: {
        AND: tokens.map((token) => ({
          OR: [
            { customer: { fullName: { contains: token, mode: "insensitive" } } },
            { customer: { phone: { contains: token, mode: "insensitive" } } },
            { product: { name: { contains: token, mode: "insensitive" } } },
            { status: { contains: token, mode: "insensitive" } },
          ],
        })),
      },
      include: {
        customer: true,
        product: true,
      },
      take: 5,
    }),
  ]);

  const results: SearchResultItem[] = [];

  customers.forEach((c) => {
    results.push({
      id: c.id,
      title: c.fullName,
      subtitle: `Phone: ${c.phone}`,
      type: "Customer",
      url: `/customers/${c.id}`,
    });
  });

  products.forEach((p) => {
    results.push({
      id: p.id,
      title: p.name,
      subtitle: `Category: ${p.category} | NPR ${p.price}`,
      type: "Product",
      url: "/products",
    });
  });

  accounts.forEach((a) => {
    results.push({
      id: a.id,
      title: a.nickname,
      subtitle: `${a.category} | ${a.loginEmail}`,
      type: "Master Account",
      url: `/accounts/${a.id}`,
    });
  });

  subscriptions.forEach((s) => {
    results.push({
      id: s.id,
      title: `${s.customer.fullName} - ${s.product.name}`,
      subtitle: `Status: ${s.status} | Expires: ${new Date(s.expiryDate).toLocaleDateString()}`,
      type: "Subscription",
      url: `/customers/${s.customerId}`,
    });
  });

  return results;
}
