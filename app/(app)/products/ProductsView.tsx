"use client";

import { useState, useMemo, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import ProductForm from "./ProductForm";
import ProductEditModal from "./ProductEditModal";
import {
  checkProductDependencies,
  deleteOrDeactivateProductAction,
  forceDeleteProductAction,
} from "@/lib/dependency-checks";

type Product = {
  id: string;
  name: string;
  category: string;
  durationDays: number;
  price: number;
  isActive: boolean;
};

export default function ProductsView({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deps, setDeps] = useState<{
    hasActiveSubscriptions: boolean;
    hasHistory: boolean;
    totalCount: number;
  } | null>(null);
  const [isChecking, startCheckTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  function handleInitiateDelete(product: Product) {
    setSelectedProduct(product);
    startCheckTransition(async () => {
      const result = await checkProductDependencies(product.id);
      setDeps(result);
    });
  }

  function handleConfirmDelete() {
    if (!selectedProduct) return;
    startDeleteTransition(async () => {
      await deleteOrDeactivateProductAction(selectedProduct.id);
      setSelectedProduct(null);
      setDeps(null);
    });
  }

  function handleForceDelete() {
    if (!selectedProduct) return;
    startDeleteTransition(async () => {
      await forceDeleteProductAction(selectedProduct.id);
      setSelectedProduct(null);
      setDeps(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Products Catalog
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage subscription plans, pricing models, and active category tags
          </p>
        </div>
        <ProductForm />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter products by name or category tag..."
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-100"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No products match the filter query.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category Tag</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {product.category}
                  </td>
                  <td className="px-4 py-3">{product.durationDays} Days</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    NPR {product.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <ProductEditModal product={product} />
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(product)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog
        isOpen={!!selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          setDeps(null);
        }}
        onConfirm={handleConfirmDelete}
        onForceDelete={deps?.hasHistory ? handleForceDelete : undefined}
        forceDeleteText="Force Delete"
        title={
          deps?.hasHistory
            ? `Manage Delete: ${selectedProduct?.name}`
            : `Delete Product: ${selectedProduct?.name}?`
        }
        description={
          isChecking ? (
            <p>Checking active subscriptions and catalog dependencies...</p>
          ) : deps?.hasHistory ? (
            <div className="space-y-2">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                Product is referenced by {deps.totalCount} historical subscription(s).
              </p>
              <p>
                You can safely <strong>Deactivate</strong> this product to keep past sales data intact, or <strong>Force Delete</strong> to remove the product and all associated subscriptions.
              </p>
            </div>
          ) : (
            <p>
              This product has zero subscription history. It will be permanently removed from the database.
            </p>
          )
        }
        confirmText={deps?.hasHistory ? "Deactivate Product" : "Permanently Delete"}
        isDestructive={!deps?.hasHistory}
        loading={isDeleting || isChecking}
      />
    </div>
  );
}
