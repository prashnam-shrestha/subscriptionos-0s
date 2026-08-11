"use client";

import { useState, useTransition } from "react";
import { addApologyDaysAction, reclaimProfileSlotAction } from "@/app/(app)/subscriptions/actions";

export function ApologyDaysModal({
  subscriptionId,
  customerName,
}: {
  subscriptionId: string;
  customerName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [days, setDays] = useState(3);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addApologyDaysAction(subscriptionId, Number(days));
      if (res.error) {
        setError(res.error);
      } else {
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500 hover:bg-amber-500/20"
      >
        + Apology Days
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold">Add Apology Days</h3>
            <p className="mt-1 text-xs text-slate-400">
              Extend subscription for <strong>{customerName}</strong> due to downtime/issues.
            </p>

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Days to Add</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isPending ? "Adding..." : "Confirm Extension"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ReclaimSeatModal({
  subscriptionId,
  profileId,
  profileName,
}: {
  subscriptionId: string;
  profileId: string;
  profileName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleReclaim() {
    startTransition(async () => {
      await reclaimProfileSlotAction(subscriptionId, profileId);
      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20"
      >
        Reclaim Seat
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-red-400">Reclaim Seat & Reset PIN</h3>
            <p className="mt-1 text-xs text-slate-400">
              Reclaiming seat for profile <strong>{profileName}</strong>. Complete checklist:
            </p>

            <div className="my-4 space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <label className="flex items-center gap-3 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={step1}
                  onChange={(e) => setStep1(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0"
                />
                Signed out former customer device from streaming service app.
              </label>

              <label className="flex items-center gap-3 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={step2}
                  onChange={(e) => setStep2(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0"
                />
                Confirmed slot is empty and ready for next customer.
              </label>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: Executing this will generate a fresh 4-digit PIN for the profile and mark it for WhatsApp re-notification.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!step1 || !step2 || isPending}
                onClick={handleReclaim}
                className="rounded bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40"
              >
                {isPending ? "Reclaiming..." : "Reclaim & Auto-Reset PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
