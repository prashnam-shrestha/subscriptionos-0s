"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type SubscriptionDetail = {
  id: string;
  status: string;
  expiryDate: string | Date;
  customer: {
    id: string;
    fullName: string;
    phone: string;
  };
  product: {
    name: string;
  };
};

export default function OccupancyDetailModal({
  profileName,
  capacity,
  subscriptions,
}: {
  profileName: string;
  capacity: number;
  subscriptions: SubscriptionDetail[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeSubs = subscriptions.filter((s) => s.status === "Active");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <span>
          {activeSubs.length} / {capacity} Seats
        </span>
        <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Slot Occupancy: ${profileName} (${activeSubs.length}/${capacity})`}
      >
        <div className="space-y-4">
          {activeSubs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No active customer subscriptions currently assigned to this slot.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {activeSubs.map((sub) => {
                const isExpired = new Date(sub.expiryDate) < new Date();
                return (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/customers/${sub.customer.id}`}
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:underline"
                      >
                        {sub.customer.fullName}
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {sub.customer.phone} | {sub.product.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Exp: {new Date(sub.expiryDate).toLocaleDateString()}
                      </div>
                      <Badge variant={isExpired ? "destructive" : "success"}>
                        {isExpired ? "Expired" : "Active"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded bg-slate-900 px-4 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
