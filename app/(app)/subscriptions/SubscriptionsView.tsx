"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import CopyContactButton from "@/components/CopyContactButton";
import LifecycleModal from "@/app/(app)/subscriptions/LifecycleModal";
import SubscriptionForm from "@/app/(app)/subscriptions/SubscriptionForm";

type SubscriptionRecord = {
  id: string;
  status: string;
  expiryDate: string;
  amountPaid: number;
  profileId: string;
  customer: {
    id: string;
    fullName: string;
    phone: string;
  };
  product: {
    name: string;
    category: string;
    price: number;
    durationDays: number;
  };
  profile: {
    profileName: string;
    masterAccount: {
      nickname: string;
      category?: string;
      loginEmail?: string;
    };
  };
};

type EligibleProfile = {
  id: string;
  profileName: string;
  accountName: string;
  availableCapacity: number;
};

type FormCustomer = { id: string; fullName: string; phone: string };
type FormProduct = { id: string; name: string; category: string; price: number; durationDays: number };
type FormProfile = {
  id: string;
  profileName: string;
  capacity: number;
  activeCount: number;
  masterAccount: { nickname: string; category: string };
};

export default function SubscriptionsView({
  subscriptions,
  eligibleProfilesMap,
  customers,
  products,
  profiles,
}: {
  subscriptions: SubscriptionRecord[];
  eligibleProfilesMap: Record<string, EligibleProfile[]>;
  customers: FormCustomer[];
  products: FormProduct[];
  profiles: FormProfile[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "TODAY" | "TOMORROW" | "SOON" | "ACTIVE" | "EXPIRED" | "CANCELLED"
  >("ACTIVE");

  const filteredSubscriptions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    const sevenDays = new Date(now);
    sevenDays.setDate(now.getDate() + 7);

    const searchTokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return subscriptions.filter((sub) => {
      const expDate = new Date(sub.expiryDate);
      const expStr = expDate.toDateString();
      const isExpired =
        sub.status === "Expired" ||
        sub.status === "Unassigned" ||
        (sub.status === "Active" && expDate < now);
      const computedStatus =
        sub.status === "Cancelled"
          ? "Cancelled"
          : isExpired
          ? "Expired"
          : "Active";

      if (filter === "TODAY" && expStr !== todayStr) return false;
      if (filter === "TOMORROW" && expStr !== tomorrowStr) return false;
      if (
        filter === "SOON" &&
        (computedStatus !== "Active" || expDate < now || expDate > sevenDays)
      )
        return false;
      if (filter === "ACTIVE" && computedStatus !== "Active") return false;
      if (filter === "EXPIRED" && computedStatus !== "Expired") return false;
      if (filter === "CANCELLED" && computedStatus !== "Cancelled") return false;

      if (searchTokens.length === 0) return true;

      const searchableText = [
        sub.customer?.fullName,
        sub.customer?.phone,
        sub.product?.name,
        sub.profile?.masterAccount?.nickname,
        sub.profile?.profileName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchTokens.every((token) => searchableText.includes(token));
    });
  }, [subscriptions, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Subscriptions Directory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Centralized index of all customer subscriptions, state management, and expiry tracking
          </p>
        </div>
        <SubscriptionForm customers={customers} products={products} profiles={profiles} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions by customer, phone, product, or account..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-100"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "TODAY", label: "Expiring Today" },
              { id: "TOMORROW", label: "Tomorrow" },
              { id: "SOON", label: "Soon (7d)" },
              { id: "ACTIVE", label: "Active" },
              { id: "EXPIRED", label: "Expired" },
              { id: "CANCELLED", label: "Cancelled" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No subscriptions match the selected search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Assigned Profile</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSubscriptions.map((sub) => {
                  const isExpired =
                    sub.status === "Expired" ||
                    sub.status === "Unassigned" ||
                    (sub.status === "Active" &&
                      new Date(sub.expiryDate) < new Date());

                  const computedStatus =
                    sub.status === "Cancelled"
                      ? "Cancelled"
                      : isExpired
                      ? "Expired"
                      : "Active";

                  const eligibleForMove = eligibleProfilesMap[sub.product.category] || [];

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => router.push(`/customers/${sub.customer.id}`)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div>
                            {sub.customer.fullName}
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                              {sub.customer.phone}
                            </div>
                          </div>
                          <CopyContactButton
                            fullName={sub.customer.fullName}
                            phone={sub.customer.phone}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {sub.product.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 dark:text-slate-100 font-medium">
                          {sub.profile.profileName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Account: {sub.profile.masterAccount.nickname}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {new Date(sub.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            computedStatus === "Cancelled"
                              ? "secondary"
                              : computedStatus === "Expired"
                              ? "destructive"
                              : "success"
                          }
                        >
                          {computedStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <LifecycleModal
                          subscriptionId={sub.id}
                          productDurationDays={sub.product.durationDays}
                          eligibleProfiles={eligibleForMove}
                          currentProfileId={sub.profileId || ""}
                          status={sub.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
