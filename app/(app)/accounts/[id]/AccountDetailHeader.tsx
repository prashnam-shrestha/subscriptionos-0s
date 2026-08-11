"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import AccountEditModal from "../AccountEditModal";
import { createTicketAction, resolveTicketAction } from "../actions";

type TicketRecord = {
  id: string;
  issue: string;
  status: string;
  createdAt: string;
};

type MasterAccount = {
  id: string;
  nickname: string;
  category: string;
  loginEmail: string;
  isActive: boolean;
  recentTicketCount?: number;
  healthStatus?: "HEALTHY" | "UNSTABLE";
  tickets?: TicketRecord[];
};

export default function AccountDetailHeader({
  account,
  categories = [],
}: {
  account: MasterAccount;
  categories?: string[];
}) {
  const router = useRouter();
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [issue, setIssue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const tickets = account.tickets ?? [];
  const openTicketCount = tickets.filter((t) => t.status === "Open").length;

  const isUnstable =
    account.healthStatus === "UNSTABLE" || (account.recentTicketCount ?? 0) >= 3;

  function handleLogTicket(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("masterAccountId", account.id);
    formData.append("issue", issue);

    startTransition(async () => {
      await createTicketAction(formData);
      setShowTicketModal(false);
      setIssue("");
      router.refresh();
    });
  }

  function handleResolveTicket(ticketId: string) {
    setResolvingId(ticketId);
    startTransition(async () => {
      await resolveTicketAction(ticketId, account.id);
      setResolvingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {account.nickname}
          </h1>
          <Badge variant={account.isActive ? "success" : "secondary"}>
            {account.isActive ? "Active" : "Inactive"}
          </Badge>

          {isUnstable ? (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500 border border-red-500/20">
              🔴 Unstable ({account.recentTicketCount ?? 3}+ Tickets in 7d)
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
              🟢 Healthy
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Category: <span className="font-mono">{account.category}</span> | Email:{" "}
          {account.loginEmail}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowComplaintsModal(true)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          View Complaints ({tickets.length})
        </button>
        <button
          onClick={() => setShowTicketModal(true)}
          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-500/20"
        >
          + Log Complaint Ticket
        </button>
        <AccountEditModal account={account} categories={categories} />
      </div>

      {showComplaintsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold">Complaint History</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {openTicketCount} open · {tickets.length} total
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowComplaintsModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto flex-1">
              {tickets.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No complaint tickets logged for this account.
                </p>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-lg border border-slate-800 bg-slate-800/50 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-200">{ticket.issue}</p>
                      <Badge
                        variant={ticket.status === "Open" ? "destructive" : "success"}
                        className="shrink-0"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {new Date(ticket.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {ticket.status === "Open" && (
                        <button
                          type="button"
                          disabled={isPending && resolvingId === ticket.id}
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isPending && resolvingId === ticket.id
                            ? "Resolving..."
                            : "Mark Resolved"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold">Log Account Complaint</h3>
            <p className="mt-1 text-xs text-slate-400">
              Log password resets, screen limit, or service kick issues.
            </p>

            <form onSubmit={handleLogTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Issue Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="e.g. Netflix too many screens error / Password changed by primary owner"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 p-2.5 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isPending ? "Logging..." : "Log Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
