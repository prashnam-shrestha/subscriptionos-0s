"use client";

import {  useState, useTransition, useMemo , useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { createSubscriptionAction } from "./actions";

type CustomerOption = { id: string; fullName: string; phone: string };
type ProductOption = { id: string; name: string; category: string; price: number; durationDays: number };
type ProfileOption = {
  id: string;
  profileName: string;
  capacity: number;
  activeCount: number;
  masterAccount: { nickname: string; category: string };
};

export default function SubscriptionForm({
  customers,
  products,
  profiles,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  profiles: ProfileOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductPrice, setSelectedProductPrice] = useState<number | "">("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const availableProfiles = useMemo(() => {
    if (!selectedProduct) return [];
    return profiles.filter((p) => {
      const categoryMatch = p.masterAccount.category.toLowerCase() === selectedProduct.category.toLowerCase();
      const hasCapacity = p.activeCount < p.capacity;
      return categoryMatch && hasCapacity;
    });
  }, [profiles, selectedProduct]);

    useEffect(() => {
    if (availableProfiles.length > 0) {
      const sorted = [...availableProfiles].sort((a, b) => a.activeCount - b.activeCount);
      setSelectedProfileId(sorted[0].id);
    } else {
      setSelectedProfileId("");
    }
  }, [availableProfiles]);

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setSelectedProductPrice(prod.price);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createSubscriptionAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        + New Subscription
      </button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Customer Subscription Allocation">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer
            </label>
            <select
              name="customerId"
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Product Plan
              </label>
              <select
                name="productId"
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount Paid (NPR)
              </label>
              <input
                type="number"
                step="0.01"
                name="amountPaid"
                value={selectedProductPrice}
                onChange={(e) => setSelectedProductPrice(e.target.value ? parseFloat(e.target.value) : "")}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assign Profile Slot
            </label>
            <select
              name="profileId"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              required
              disabled={!selectedProductId}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50"
            >
              {!selectedProductId ? (
                <option value="">Select a product first</option>
              ) : availableProfiles.length === 0 ? (
                <option value="">
                  {`No open capacity slots in category "${selectedProduct?.category}"`}
                </option>
              ) : (
                <>
                  <option value="">-- Choose Profile Slot --</option>
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.masterAccount.nickname} → {p.profileName} ({p.capacity - p.activeCount} seats available)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
            >
              {isPending ? "Allocating..." : "Allocate Subscription"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
