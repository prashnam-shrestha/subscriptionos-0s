import { prisma } from "@/lib/db";
import ProductsView from "./ProductsView";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return <ProductsView products={products} />;
}
