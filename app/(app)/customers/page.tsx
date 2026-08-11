import { prisma } from "@/lib/db";
import CustomersView from "./CustomersView";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      subscriptions: true,
    },
    orderBy: { fullName: "asc" },
  });

  return <CustomersView customers={customers} />;
}
