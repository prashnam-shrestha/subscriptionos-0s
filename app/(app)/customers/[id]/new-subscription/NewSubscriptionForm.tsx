"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionAction } from "@/app/(app)/subscriptions/actions";

type ProductOption = {
  id: string;
  name: string;
  category: string;
  price: number;
  durationDays: number;
};

type ProfileOption = {
  id: string;
  profileName: string;
  capacity: number;
  activeCount: number;
  masterAccount: { nickname: string; category: string };
};

export default function NewSubscriptionForm({
  customerId,
  products,
  profiles,
}: {
  customerId: string;
  products: ProductOption[];
  profiles: ProfileOption[];
}) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [amountPaid, setAmountPaid] = useState(products[0]?.price.toString() || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const availableProfiles = useMemo(() => {
    if (!selectedProduct) return [];
    return profiles.filter((p) => {
      const categoryMatch =
        p.masterAccount.category.toLowerCase() === selectedProduct.category.toLowerCase();
      const hasCapacity = p.activeCount < p.capacity;
      return categoryMatch && hasCapacity;
    });
  }, [profiles, selectedProduct]);

  function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setAmountPaid(prod.price.toString());
    }
  }

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const res = await createSubscriptionAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push(`/customers/${customerId}`);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-400">
        No active products found. Please create active products under the Products section first.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="customerId" value={customerId} />

      {error && (
        <div className="rounded bg-red-50 p-4 text-sm text-red-600 border border-red-200 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Select Product *
        </label>
        <select
          name="productId"
          value={selectedProductId}
          onChange={handleProductChange}
          required
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-100"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id} className="dark:bg-slate-900 dark:text-slate-100">
              {p.name} — Category: {p.category} (NPR {p.price}, {p.durationDays} Days)
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <div className="rounded-md bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Category Tag:</span>{" "}
            {selectedProduct.category}
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Duration:</span>{" "}
            {selectedProduct.durationDays} Days
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Assign Profile Slot *
        </label>
        <select
          name="profileId"
          required
          disabled={!selectedProductId}
          className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-100 disabled:opacity-50"
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
                <option key={p.id} value={p.id} className="dark:bg-slate-900 dark:text-slate-100">
                  {p.masterAccount.nickname} → {p.profileName} ({p.capacity - p.activeCount} seats available)
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Amount Paid (NPR) *
          </label>
          <input
            type="number"
            step="0.01"
            name="amountPaid"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Start Date *
          </label>
          <input
            type="date"
            name="startDate"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {loading ? "Allocating Profile Seat..." : "Confirm & Create Subscription"}
      </button>
    </form>
  );
}
