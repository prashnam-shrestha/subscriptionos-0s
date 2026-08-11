"use client";

import { useState } from "react";
import { createCustomer } from "./actions";
import { Dialog } from "@/components/ui/dialog";

export default function CustomerForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);

    const res = await createCustomer(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setLoading(false);
      setError("");
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
      >
        + New Customer
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError("");
        }}
        title="Add New Customer"
      >
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              required
              placeholder="e.g. Ram Shrestha"
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              required
              placeholder="e.g. 9841234567"
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Prefers WhatsApp communication"
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {loading ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
