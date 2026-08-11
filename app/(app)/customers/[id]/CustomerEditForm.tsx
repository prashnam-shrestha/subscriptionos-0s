"use client";

import { useState } from "react";
import { updateCustomer, toggleCustomerStatus } from "../actions";

export default function CustomerEditForm({
  customer,
}: {
  customer: { id: string; fullName: string; phone: string; notes: string | null; isActive: boolean };
}) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setMessage("");
    setLoading(true);

    const res = await updateCustomer(customer.id, formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setMessage("Customer details updated successfully.");
    }
    setLoading(false);
  }

  async function handleToggleStatus() {
    setError("");
    setMessage("");
    const res = await toggleCustomerStatus(customer.id, customer.isActive);
    if (res?.error) {
      setError(res.error);
    } else {
      setMessage("Customer status updated.");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded bg-green-50 p-3 text-sm text-green-700 border border-green-200 dark:bg-green-950/50 dark:border-green-900 dark:text-green-400">
          {message}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            defaultValue={customer.fullName}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            defaultValue={customer.phone}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={customer.notes || ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {loading ? "Updating..." : "Update Customer"}
        </button>
      </form>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={handleToggleStatus}
          className="w-full rounded-md border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {customer.isActive ? "Deactivate Customer" : "Reactivate Customer"}
        </button>
      </div>
    </div>
  );
}