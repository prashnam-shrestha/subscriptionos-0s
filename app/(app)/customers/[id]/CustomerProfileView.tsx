"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import CopyContactButton from "@/components/CopyContactButton";
import CustomerEditForm from "./CustomerEditForm";
import LifecycleModal from "@/app/(app)/subscriptions/LifecycleModal";

type Subscription = {
  id: string;
  status: string;
  expiryDate: string;
  amountPaid: number;
  startDate: string;
  createdAt: string;
  profileId: string;
  product: { name: string; category: string; price: number; durationDays: number };
  profile: {
    profileName: string;
    masterAccount: { nickname: string; category: string };
  };
};

type RenewalLog = {
  id: string;
  amountPaid: number;
  renewedAt: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  subscription: {
    product: { name: string };
  };
};

type EligibleProfile = {
  id: string;
  profileName: string;
  accountName: string;
  availableCapacity: number;
};

type CustomerProfile = {
  id: string;
  fullName: string;
  phone: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  subscriptions: Subscription[];
  renewalLogs: RenewalLog[];
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function CustomerProfileView({
  customer,
  eligibleProfilesByCategory,
}: {
  customer: CustomerProfile;
  eligibleProfilesByCategory: Record<string, EligibleProfile[]>;
}) {
  const activeSubs = customer.subscriptions.filter((s) => s.status === "Active");
  const totalSpent = customer.subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);

  return (
    <div className="space-y-8">
      <Link
        href="/customers"
        className="inline-flex text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        ← Back to Customers
      </Link>

      {/* Avatar Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-600 text-xl font-bold text-white shadow-md dark:from-slate-200 dark:to-slate-400 dark:text-slate-900">
              {getInitials(customer.fullName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {customer.fullName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                  {customer.phone}
                </span>
                <CopyContactButton fullName={customer.fullName} phone={customer.phone} />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Customer since{" "}
                {new Date(customer.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={customer.isActive ? "success" : "secondary"}>
              {customer.isActive ? "Active Contact" : "Inactive"}
            </Badge>
            <Badge variant="secondary">{activeSubs.length} Active Subs</Badge>
            <Badge variant="secondary">NPR {totalSpent.toLocaleString()} Lifetime</Badge>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Customer Information
          </h2>
          <CustomerEditForm customer={customer} />
        </section>

        {/* Active Subscriptions */}
        <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Active Subscriptions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {customer.subscriptions.length} total record(s) on file
              </p>
            </div>
            <Link
              href={`/customers/${customer.id}/new-subscription`}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              + New Subscription
            </Link>
          </div>

          {customer.subscriptions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No subscriptions for this customer yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Assigned Profile</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {customer.subscriptions.map((sub) => {
                    const isExpired =
                      sub.status === "Active" && new Date(sub.expiryDate) < new Date();

                    const computedStatus =
                      sub.status === "Cancelled"
                        ? "Cancelled"
                        : sub.status === "Expired" || sub.status === "Unassigned" || isExpired
                        ? "Expired"
                        : "Active";

                    const eligibleForMove =
                      eligibleProfilesByCategory[sub.product.category] || [];

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {sub.product.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {sub.profile.profileName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {sub.profile.masterAccount.nickname}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {new Date(sub.expiryDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
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
                        <td className="px-4 py-3 space-y-1">
                          <Link
                            href={`/subscriptions/${sub.id}/credentials`}
                            className="block text-xs font-semibold text-slate-900 dark:text-slate-100 hover:underline"
                          >
                            View Credentials
                          </Link>
                          <LifecycleModal
                            subscriptionId={sub.id}
                            productDurationDays={sub.product.durationDays}
                            eligibleProfiles={eligibleForMove}
                            currentProfileId={sub.profileId}
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
        </section>
      </div>

      {/* Billing & Activity Log */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Billing & Activity Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Subscription purchases and renewal history
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {customer.subscriptions.map((sub) => (
            <div
              key={`purchase-${sub.id}`}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  New Subscription — {sub.product.name}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {new Date(sub.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                NPR {sub.amountPaid.toLocaleString()}
              </span>
            </div>
          ))}

          {customer.renewalLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  Renewal — {log.subscription.product.name}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {new Date(log.renewedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · Extended to{" "}
                  {new Date(log.newExpiryDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                + NPR {log.amountPaid.toLocaleString()}
              </span>
            </div>
          ))}

          {customer.subscriptions.length === 0 && customer.renewalLogs.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No billing activity recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
