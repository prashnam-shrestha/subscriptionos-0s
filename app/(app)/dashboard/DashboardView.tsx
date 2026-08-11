"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/global-search";
import { Search, TrendingUp, Users, Wallet, Layers, AlertTriangle } from "lucide-react";

type DashboardProps = {
  metrics: {
    totalRevenue: number;
    mrr: number;
    activeSubscriptions: number;
    customerCount: number;
    masterAccountCount: number;
    expiringSoonCount: number;
    utilizationPct: number;
    totalOccupiedSlots: number;
    totalSlots: number;
  };
  salesTrend: { label: string; revenue: number; count: number }[];
  categoryChartData: { name: string; value: number }[];
  chartColors: string[];
  expiringSoonSubscriptions: {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    masterAccountNickname: string;
    profileName: string;
    expiryDate: string;
  }[];
  recentRenewals: {
    id: string;
    customerName: string;
    productName: string;
    amountPaid: number;
    renewedAt: string;
  }[];
};

export default function DashboardView({
  
  

  metrics,
  salesTrend,
  categoryChartData,
  chartColors,
  expiringSoonSubscriptions,
  recentRenewals,
}: DashboardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className="space-y-8">
        {/* Global Search Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-lg dark:border-slate-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_50%)]" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Operational Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Search customers, subscriptions, and accounts — or explore live metrics below.
                </p>
              </div>
              <Badge variant="success" className="shrink-0">
                System Online
              </Badge>
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="group flex w-full max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-left backdrop-blur-sm transition hover:border-white/20 hover:bg-white/15"
            >
              <Search className="h-5 w-5 text-slate-300 group-hover:text-white" />
              <span className="flex-1 text-sm text-slate-300 group-hover:text-white">
                Search customers, products, master accounts, subscriptions...
              </span>
              <kbd className="hidden rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300 sm:inline-block">
                ⌘K
              </kbd>
            </button>
          </div>
        </section>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Monthly Recurring Revenue",
              value: `NPR ${metrics.mrr.toLocaleString()}`,
              icon: TrendingUp,
              accent: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Gross Revenue",
              value: `NPR ${metrics.totalRevenue.toLocaleString()}`,
              icon: Wallet,
              accent: "text-slate-900 dark:text-slate-100",
            },
            {
              label: "Active Subscriptions",
              value: metrics.activeSubscriptions.toString(),
              icon: Layers,
              accent: "text-slate-900 dark:text-slate-100",
            },
            {
              label: "Expiring (7 Days)",
              value: metrics.expiringSoonCount.toString(),
              icon: AlertTriangle,
              accent: "text-amber-600 dark:text-amber-400",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <card.icon className={`h-4 w-4 ${card.accent}`} />
              </div>
              <p className={`mt-2 text-2xl font-extrabold ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sales Volume Trend */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Sales Volume (Last 3 Months)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Weekly sales revenue and transaction count over the last 90 days
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "revenue") {
                        return [`NPR ${Number(value ?? 0).toLocaleString()}`, "Revenue"];
                      }
                      return [Number(value ?? 0), "Transactions"];
                    }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="revenue"
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Revenue Pie */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Revenue by Product
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Active subscription revenue breakdown
            </p>
            {categoryChartData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-xs text-slate-500">
                No active revenue data
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `NPR ${Number(value ?? 0).toLocaleString()}`,
                        "Revenue",
                      ]}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                  {categoryChartData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: chartColors[i % chartColors.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        NPR {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seat Utilization Gauge */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Seat Occupancy & Utilization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {metrics.totalOccupiedSlots} of {metrics.totalSlots} profile seats occupied across active master accounts
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {metrics.utilizationPct}%
                </span>
                <p className="text-[11px] text-slate-500">Utilization</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="h-4 w-4" />
                {metrics.customerCount} customers · {metrics.masterAccountCount} accounts
              </div>
            </div>
          </div>
          <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 transition-all duration-500"
              style={{ width: `${Math.min(metrics.utilizationPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Expiring Soon Alerts ({expiringSoonSubscriptions.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subscriptions expiring within the next 7 days
              </p>
            </div>
          </div>

          {expiringSoonSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No subscriptions expiring within the next 7 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Master Account</th>
                    <th className="px-4 py-3">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {expiringSoonSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => {
                        window.location.href = `/customers/${sub.customerId}`;
                      }}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {sub.customerName}
                        <div className="text-xs font-normal text-slate-500">{sub.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">{sub.productName}</td>
                      <td className="px-4 py-3 font-medium">
                        {sub.masterAccountNickname} ({sub.profileName})
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                        {new Date(sub.expiryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Renewals */}
        {recentRenewals.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Recent Renewal Activity
            </h3>
            <div className="space-y-2">
              {recentRenewals.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs dark:border-slate-800"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {r.customerName} — {r.productName}
                  </span>
                  <span className="text-slate-500">
                    NPR {r.amountPaid.toLocaleString()} ·{" "}
                    {new Date(r.renewedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
