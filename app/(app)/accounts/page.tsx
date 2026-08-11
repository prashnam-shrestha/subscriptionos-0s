import { prisma } from "@/lib/db";
import AccountsView from "./AccountsView";

export const revalidate = 0;

export default async function AccountsPage() {
  const [accounts, products] = await Promise.all([
    prisma.masterAccount.findMany({
      include: {
        profiles: {
          include: {
            subscriptions: {
              select: { id: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: { category: true },
      where: { isActive: true },
    }),
  ]);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort();

  return <AccountsView accounts={accounts} categories={categories} />;
}
