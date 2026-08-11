"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addApologyDaysAction,
  reclaimSeatAction,
  renewSubscriptionAction,
  cancelSubscriptionAction,
  moveSubscriptionAction,
  deleteSubscriptionAction,
} from "./actions";

type ProfileOption = {
  id: string;
  profileName: string;
  accountName: string;
  availableCapacity: number;
};

export default function LifecycleModal({
  subscriptionId,
  productDurationDays,
  eligibleProfiles,
  currentProfileId,
  status,
}: {
  subscriptionId: string;
  productDurationDays: number;
  eligibleProfiles: ProfileOption[];
  currentProfileId: string;
  status: string;
}) {
  const [actionsWindowOpen, setActionsWindowOpen] = useState(false);
  const [mode, setMode] = useState<
    "renew" | "cancel" | "move" | "apology" | "reclaim" | null
  >(null);
  const [apologyDays, setApologyDays] = useState("1");
  const [renewDays, setRenewDays] = useState(productDurationDays.toString());
  const [selectedProfileId, setSelectedProfileId] = useState(
    eligibleProfiles.filter((p) => p.id !== currentProfileId)[0]?.id || ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Active = seat still attached; Expired/Unassigned = seat reclaimed; Cancelled = soft-cancelled
  const seatOccupied = status === "Active";
  const seatReclaimed = status === "Expired" || status === "Unassigned";
  const isCancelled = status === "Cancelled";

  function handleSelectAction(
    actionMode: "renew" | "cancel" | "move" | "apology" | "reclaim"
  ) {
    setMode(actionMode);
    setError("");
    setActionsWindowOpen(false);
  }

  function handleCloseAll() {
    setActionsWindowOpen(false);
    setMode(null);
    setError("");
  }

  async function handleRenewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const daysNum = parseInt(renewDays, 10);
    if (isNaN(daysNum) || daysNum <= 0) {
      setError("Please enter a valid number of days.");
      setLoading(false);
      return;
    }
    const res = await renewSubscriptionAction(subscriptionId, daysNum);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      handleCloseAll();
    }
  }

  async function handleCancelSubmit() {
    setLoading(true);
    setError("");

    const res = await cancelSubscriptionAction(subscriptionId);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      handleCloseAll();
    }
  }

  async function handleReclaimSubmit() {
    setLoading(true);
    setError("");
    const res = await reclaimSeatAction(subscriptionId);
    setLoading(false);
    if (res?.error) setError(res.error);
    else handleCloseAll();
  }

  async function handleMoveSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await moveSubscriptionAction(subscriptionId, selectedProfileId);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      handleCloseAll();
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setError("");
          setActionsWindowOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Actions
      </button>

      {/* Main Actions Selection Window */}
      {actionsWindowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl space-y-4 dark:bg-slate-900 border dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Subscription Actions
              </h3>
              <button
                type="button"
                onClick={handleCloseAll}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {error && (
                <div className="rounded bg-red-50 p-2 text-xs text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                  {error}
                </div>
              )}

              <Link
                href={`/subscriptions/${subscriptionId}/credentials`}
                className="flex items-center justify-between w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                onClick={handleCloseAll}
              >
                <span>Credentials</span>
                <span className="text-slate-400">→</span>
              </Link>

              {!isCancelled && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectAction("apology")}
                    className="flex items-center justify-between w-full rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100/50 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-colors text-left"
                  >
                    <span>+ Apology Extension</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAction("renew")}
                    className="flex items-center justify-between w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span>Renew Subscription</span>
                    <span className="text-slate-400">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAction("move")}
                    className="flex items-center justify-between w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span>Move Profile</span>
                    <span className="text-slate-400">→</span>
                  </button>
                </>
              )}

              {/* Active + seat attached → Reclaim is the primary teardown action; Cancel is hidden */}
              {seatOccupied && (
                <button
                  type="button"
                  onClick={() => handleSelectAction("reclaim")}
                  className="flex items-center justify-between w-full rounded-md border border-purple-200 bg-purple-50/50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100/50 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-400 dark:hover:bg-purple-950/40 transition-colors text-left"
                >
                  <span>Reclaim Seat</span>
                  <span>→</span>
                </button>
              )}

              {/* Cancel only after seat is reclaimed/detached */}
              {seatReclaimed && (
                <button
                  type="button"
                  onClick={() => handleSelectAction("cancel")}
                  className="flex items-center justify-between w-full rounded-md border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100/50 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors text-left"
                >
                  <span>Cancel Subscription</span>
                  <span>→</span>
                </button>
              )}

              {/* Permanent delete only for cancelled records */}
              {isCancelled && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Permanently delete this cancelled subscription and its related data? This cannot be undone."
                      )
                    ) {
                      return;
                    }
                    setLoading(true);
                    setError("");
                    const res = await deleteSubscriptionAction(subscriptionId);
                    setLoading(false);
                    if (res?.error) {
                      setError(res.error);
                      return;
                    }
                    handleCloseAll();
                  }}
                  className="flex items-center justify-between w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60 transition-colors text-left disabled:opacity-50"
                >
                  <span>{loading ? "Deleting..." : "Delete Data"}</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Specific Sub-Modals */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4 dark:bg-slate-900 border dark:border-slate-800">
            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                {error}
              </div>
            )}

            {mode === "apology" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError("");
                  const res = await addApologyDaysAction(subscriptionId, parseInt(apologyDays) || 1);
                  setLoading(false);
                  if (res?.error) setError(res.error);
                  else handleCloseAll();
                }}
                className="space-y-4"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Apology Extension</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Compensate customer for service outage by extending subscription expiry.</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Days to Extend</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={apologyDays}
                    onChange={(e) => setApologyDays(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <div className="flex gap-2 mt-2">
                    {[30, 60, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRenewDays(d.toString())}
                        className={`px-2.5 py-1 text-xs rounded border transition ${
                          renewDays === d.toString()
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
                      >
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={handleCloseAll} className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="rounded bg-amber-500 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-amber-400 disabled:opacity-50">
                    {loading ? "Extending..." : "Confirm Extension"}
                  </button>
                </div>
              </form>
            )}

            {mode === "renew" && (
              <form onSubmit={handleRenewSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Renew Subscription
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Duration Extension (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={renewDays}
                    onChange={(e) => setRenewDays(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <div className="flex gap-2 mt-2">
                    {[30, 60, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRenewDays(d.toString())}
                        className={`px-2.5 py-1 text-xs rounded border transition ${
                          renewDays === d.toString()
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
                      >
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {loading ? "Processing..." : "Confirm Renewal"}
                  </button>
                </div>
              </form>
            )}

            {mode === "cancel" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Cancel Subscription
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to cancel this subscription? The profile seat has already been reclaimed.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Keep Record
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSubmit}
                    disabled={loading}
                    className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? "Cancelling..." : "Confirm Cancellation"}
                  </button>
                </div>
              </div>
            )}

            {mode === "reclaim" && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Reclaim Seat & Reset PIN
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This will expire and unassign the subscription, regenerate a new secure PIN for this profile, notify remaining profile users, and free the seat. Cancel becomes available after reclaim.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReclaimSubmit}
                    disabled={loading}
                    className="rounded bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? "Reclaiming..." : "Confirm Reclaim"}
                  </button>
                </div>
              </div>
            )}

            {mode === "move" && (
              <form onSubmit={handleMoveSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Move to Another Profile
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Select Target Profile
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {eligibleProfiles
                      .filter((p) => p.id !== currentProfileId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.accountName} - {p.profileName} ({p.availableCapacity} slots left)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedProfileId}
                    className="rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {loading ? "Moving..." : "Confirm Move"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
