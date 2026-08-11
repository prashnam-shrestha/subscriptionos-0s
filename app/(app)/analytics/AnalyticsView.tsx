"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteSaleAction } from "@/app/(app)/revenue/actions";

type SaleRecord = {
  id: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  productName: string;
  productCategory: string;
  profileName: string;
  masterAccountNickname: string;
  amountPaid: number;
  startDate: string;
  expiryDate: string;
  createdAt: string;
  status: string;
};

type AnalyticsData = {
  mrr: number;
  grossActiveRevenue: number;
  activeSubscriptionsCount: number;
  expiringSoonCount: number;
  totalCustomers: number;
  totalSeatsProvisioned: number;
  totalSeatsOccupied: number;
  seatUtilizationRate: number;
  categoryStats: Record<string, { count: number; revenue: number }>;
  salesHistory: SaleRecord[];
};

export default function AnalyticsView({ data }: { data: AnalyticsData }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeleteSale(e: React.MouseEvent, saleId: string) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this sale record?")) {
      return;
    }
    setDeletingId(saleId);
    startTransition(async () => {
      await deleteSaleAction(saleId);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Revenue Analytics & Financial Insights
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Real-time recurring revenue engine, seat capacity utilization, and category performance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Monthly Recurring Revenue (MRR)
          </span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            NPR {data.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Normalized 30-day run rate
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Gross Revenue
          </span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            NPR {data.grossActiveRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Total active billing value
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Seat Utilization Rate
          </span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {data.seatUtilizationRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {data.totalSeatsOccupied} of {data.totalSeatsProvisioned} seats assigned
          </span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Expiring in 7 Days
          </span>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {data.expiringSoonCount}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Immediate renewal targets
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Capacity & Seat Occupancy Gauge
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Overall Utilization</span>
              <span>{data.seatUtilizationRate.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-slate-900 dark:bg-slate-100 transition-all duration-300"
                style={{ width: `${Math.min(data.seatUtilizationRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Occupied: {data.totalSeatsOccupied}</span>
              <span>Available: {data.totalSeatsProvisioned - data.totalSeatsOccupied}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Category Revenue Distribution
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Object.entries(data.categoryStats).length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                No active category data available.
              </div>
            ) : (
              Object.entries(data.categoryStats).map(([cat, stats]) => (
                <div key={cat} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {cat}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {stats.count} active subscription(s)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      NPR {stats.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Sales History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete transaction history and sold subscription records
          </p>
        </div>

        {!data.salesHistory || data.salesHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No sales transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Assigned Profile</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.salesHistory.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/customers/${sale.customerId}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {sale.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sale.customerPhone}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {sale.productName}
                      <span className="block text-[10px] text-slate-400">
                        {sale.productCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="font-medium">{sale.profileName}</span>
                      <span className="block text-[10px] text-slate-400">
                        {sale.masterAccountNickname}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      NPR {sale.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(sale.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sale.status === "Active" ? "success" : "secondary"}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSale(e, sale.id)}
                        disabled={isPending && deletingId === sale.id}
                        title="Delete sale record"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
